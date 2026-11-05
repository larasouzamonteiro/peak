// CampanhasBD.js
// Tabelas "campanhas", "campanha_jogadores" e "campanha_monstros".
//
// Dois tipos de campanha moram na mesma tabela:
//   oficial = 1 -> campanha oficial da Peak (feita pelo admin). Não tem Mestre nem código.
//   oficial = 0 -> campanha de uma pessoa. Quem cria é o Mestre; os jogadores entram com o código.

const conexao = require('./conexao')

// Gera um código de convite como "KFRT-4821"
function gerarCodigo(){
    var letras = 'ABCDEFGHJKLMNPQRSTUVWXYZ'
    var codigo = ''

    for(var i = 0; i < 4; i++){
        codigo = codigo + letras.charAt(Math.floor(Math.random() * letras.length))
    }

    return codigo + '-' + (1000 + Math.floor(Math.random() * 9000))
}

class CampanhasBD{

    static connect(){
        // versão servidor: usa o pool (veja database/conexao.js)
        return conexao
    }

    // ---------- LISTAS ----------
    // As campanhas em que a pessoa é Mestre ou jogadora
    static getCampanhas(usuarioId, callback){
        const connection = CampanhasBD.connect()

        // o "in (select ...)" pega as campanhas em que a pessoa aparece como jogadora
        var sql = `
            select c.id, c.nome, c.descricao, c.imagemCapa, c.usuarioMestreId, u.nomeUsuario as mestre
            from campanhas c
            join usuarios u on u.id = c.usuarioMestreId
            where c.oficial = 0
            and (c.usuarioMestreId = ? or c.id in (select campanhaId from campanha_jogadores where usuarioId = ?))
            order by c.id`

        connection.query(sql, [usuarioId, usuarioId], (error, results)=>{
            if(error){ console.log(error.message); return callback({'error': 'Erro no servidor. Tente de novo.'}) }

            callback(results)
        })

        connection.end()
    }

    // As campanhas oficiais da Peak
    static getOficiais(callback){
        const connection = CampanhasBD.connect()

        var sql = 'select id, nome, descricao, historia, imagemCapa, criadaPor from campanhas where oficial = 1 order by id'

        connection.query(sql, (error, results)=>{
            if(error){ console.log(error.message); return callback({'error': 'Erro no servidor. Tente de novo.'}) }

            callback(results)
        })

        connection.end()
    }

    // ---------- UMA CAMPANHA ABERTA ----------
    // Só quem participa (Mestre ou jogador) pode ver.
    static getCampanha(id, usuarioId, callback){
        const connection = CampanhasBD.connect()

        var sql = `
            select c.id, c.nome, c.descricao, c.historia, c.imagemCapa, c.codigoConvite,
                   c.usuarioMestreId, c.oficialId, c.criadaPor, u.nomeUsuario as mestre
            from campanhas c
            join usuarios u on u.id = c.usuarioMestreId
            where c.id = ?
            and (c.usuarioMestreId = ? or c.id in (select campanhaId from campanha_jogadores where usuarioId = ?))`

        connection.query(sql, [id, usuarioId, usuarioId], (error, results)=>{
            if(error){ console.log(error.message); return callback({'error': 'Erro no servidor. Tente de novo.'}) }

            if(results.length == 0){
                callback({'error': 'Campanha não encontrada'})
            }else{
                // versão servidor: o código de convite só vai para o Mestre
                if(results[0].usuarioMestreId != usuarioId){
                    results[0].codigoConvite = ''
                }
                callback(results[0])
            }
        })

        connection.end()
    }

    // Os jogadores da campanha, cada um com a ficha que escolheu
    // (versão servidor: só quem participa da campanha consegue ver)
    static getJogadores(campanhaId, usuarioId, callback){
        const connection = CampanhasBD.connect()

        var sql = `
            select f.*, u.nomeUsuario as jogador, r.nome as raca, cl.nome as classe
            from campanha_jogadores cj
            join usuarios u on u.id = cj.usuarioId
            join fichas f on f.id = cj.fichaId
            join racas r on r.id = f.racaId
            join classes cl on cl.id = f.classeId
            where cj.campanhaId = ?
            and cj.campanhaId in (select id from campanhas where usuarioMestreId = ? union select campanhaId from campanha_jogadores where usuarioId = ?)
            order by cj.id`

        connection.query(sql, [campanhaId, usuarioId, usuarioId], (error, results)=>{
            if(error){ console.log(error.message); return callback({'error': 'Erro no servidor. Tente de novo.'}) }

            callback(results)
        })

        connection.end()
    }

    // Companheiros de mesa da pessoa (aba Amigos do perfil): todo mundo que está
    // em alguma campanha junto com ela, como Mestre ou como jogador.
    // Não depende de quem está olhando: qualquer pessoa logada vê a mesma lista.
    // Só devolve id, nome e foto (nada de e-mail, telefone, token ou senha).
    //   1ª parte: os Mestres das campanhas em que a pessoa joga
    //   2ª parte: os jogadores das campanhas em que a pessoa é Mestre ou joga
    static getCompanheiros(usuarioId, callback){
        const connection = CampanhasBD.connect()

        var sql = `
            select distinct u.id, u.nomeUsuario, u.fotoPerfil
            from usuarios u
            where u.id <> ?
            and (
                u.id in (select c.usuarioMestreId from campanhas c
                         join campanha_jogadores cj on cj.campanhaId = c.id
                         where cj.usuarioId = ?)
                or
                u.id in (select cj.usuarioId from campanha_jogadores cj
                         where cj.campanhaId in (select id from campanhas where usuarioMestreId = ?
                                                 union select campanhaId from campanha_jogadores where usuarioId = ?))
            )
            order by u.nomeUsuario`

        connection.query(sql, [usuarioId, usuarioId, usuarioId, usuarioId], function(error, results){
            if(error){ console.log(error.message); return callback({'error': 'Erro no servidor. Tente de novo.'}) }

            callback(results)
        })

        connection.end()
    }

    // Os monstros que o Mestre colocou na campanha.
    // linhaId = id da linha em campanha_monstros (é ele que o botão Remover usa)
    // (versão servidor: só quem participa da campanha consegue ver)
    // (FOTOS MAIS RÁPIDAS: o m.id as monstroId é usado pelo ImagensBD.trocarFotos no app.js)
    static getMonstros(campanhaId, usuarioId, callback){
        const connection = CampanhasBD.connect()

        var sql = `
            select cm.id as linhaId, m.id as monstroId, m.nome, m.imagem, m.vidaMaxima, m.defesa
            from campanha_monstros cm
            join monstros m on m.id = cm.monstroId
            where cm.campanhaId = ?
            and cm.campanhaId in (select id from campanhas where usuarioMestreId = ? union select campanhaId from campanha_jogadores where usuarioId = ?)
            order by cm.id`

        connection.query(sql, [campanhaId, usuarioId, usuarioId], (error, results)=>{
            if(error){ console.log(error.message); return callback({'error': 'Erro no servidor. Tente de novo.'}) }

            callback(results)
        })

        connection.end()
    }

    // ---------- CRIAR, EDITAR E EXCLUIR ----------
    // campanha: { usuarioMestreId, nome, descricao, historia, imagemCapa }
    static addCampanha(campanha, callback){

        if(!campanha.nome){
            return callback({'error': 'Dê um nome para a campanha'})
        }

        var nova = {
            usuarioMestreId: campanha.usuarioMestreId,
            nome: campanha.nome,
            descricao: campanha.descricao,
            historia: campanha.historia,
            imagemCapa: campanha.imagemCapa,
            codigoConvite: gerarCodigo()
        }

        const connection = CampanhasBD.connect()

        connection.query('insert into campanhas set ?', nova, (error, results)=>{
            if(error){ console.log(error.message); return callback({'error': 'Erro no servidor. Tente de novo.'}) }

            callback({'message': 'Campanha criada! Código de convite: ' + nova.codigoConvite, id: results.insertId})
        })

        connection.end()
    }

    // Editar: só o resumo e a história. campanha: { id, descricao, historia }
    static atualizar(campanha, usuarioId, callback){
        const connection = CampanhasBD.connect()

        var sql = 'update campanhas set descricao = ?, historia = ? where id = ? and usuarioMestreId = ?'

        connection.query(sql, [campanha.descricao, campanha.historia, campanha.id, usuarioId], (error, results)=>{
            if(error){ console.log(error.message); return callback({'error': 'Erro no servidor. Tente de novo.'}) }

            if(results.affectedRows == 0){
                callback({'error': 'Só o Mestre pode editar a campanha'})
            }else{
                callback({'message': 'Campanha salva!'})
            }
        })

        connection.end()
    }

    // Só o Mestre exclui a campanha
    static excluir(id, usuarioId, callback){
        const connection = CampanhasBD.connect()

        var sql = 'delete from campanhas where id = ? and usuarioMestreId = ?'

        connection.query(sql, [id, usuarioId], (error, results)=>{
            if(error){ console.log(error.message); return callback({'error': 'Erro no servidor. Tente de novo.'}) }

            if(results.affectedRows == 0){
                callback({'error': 'Só o Mestre pode excluir a campanha'})
            }else{
                callback({'message': 'Campanha excluída!'})
            }
        })

        connection.end()
    }

    // ---------- USAR UMA CAMPANHA OFICIAL ----------
    // Cria uma campanha nova, igual à oficial, com a pessoa de Mestre.
    // A cópia guarda em "oficialId" de qual campanha oficial ela veio: é assim que
    // o Painel do Mestre sabe quais monstros daquela história mostrar.
    static usarOficial(oficialId, usuarioId, callback){
        const connection = CampanhasBD.connect()

        var sql = 'select * from campanhas where id = ? and oficial = 1'

        connection.query(sql, [oficialId], (error, results)=>{
            if(error){ console.log(error.message); return callback({'error': 'Erro no servidor. Tente de novo.'}) }

            if(results.length == 0){
                connection.end()
                return callback({'error': 'Campanha oficial não encontrada'})
            }

            var oficial = results[0]

            var copia = {
                usuarioMestreId: usuarioId,
                nome: oficial.nome,
                descricao: oficial.descricao,
                historia: oficial.historia,
                imagemCapa: oficial.imagemCapa,
                codigoConvite: gerarCodigo(),
                oficialId: oficial.id,
                criadaPor: oficial.criadaPor
            }

            connection.query('insert into campanhas set ?', copia, (error, results)=>{
                if(error){ console.log(error.message); return callback({'error': 'Erro no servidor. Tente de novo.'}) }

                connection.end()
                callback({'message': 'Campanha criada! Você é o Mestre.', id: results.insertId})
            })
        })
    }

    // ---------- ENTRAR E SAIR ----------
    // O jogador entra com o código de convite e uma ficha dele
    // dados: { codigo, usuarioId, fichaId }
    static entrar(dados, callback){

        if(!dados.codigo || !dados.fichaId){
            return callback({'error': 'Digite o código e escolha uma ficha'})
        }

        const connection = CampanhasBD.connect()

        // 1. a campanha existe?
        var sql = 'select id, usuarioMestreId from campanhas where codigoConvite = ?'

        connection.query(sql, [dados.codigo], (error, campanhas)=>{
            if(error){ console.log(error.message); return callback({'error': 'Erro no servidor. Tente de novo.'}) }

            if(campanhas.length == 0){
                connection.end()
                return callback({'error': 'Código de convite não encontrado'})
            }

            var campanha = campanhas[0]

            if(campanha.usuarioMestreId == dados.usuarioId){
                connection.end()
                return callback({'error': 'Você é o Mestre desta campanha'})
            }

            // 2. a ficha é da pessoa? ela já está na campanha?
            var sql2 = `
                select
                (select count(*) from fichas where id = ? and usuarioId = ?) as fichaMinha,
                (select count(*) from campanha_jogadores where campanhaId = ? and usuarioId = ?) as jaEntrei`

            connection.query(sql2, [dados.fichaId, dados.usuarioId, campanha.id, dados.usuarioId], (error, results)=>{
                if(error){ console.log(error.message); return callback({'error': 'Erro no servidor. Tente de novo.'}) }

                if(results[0].fichaMinha == 0){
                    connection.end()
                    return callback({'error': 'Escolha uma ficha sua'})
                }

                if(results[0].jaEntrei > 0){
                    connection.end()
                    return callback({'error': 'Você já está nesta campanha'})
                }

                // 3. entra
                var jogador = {campanhaId: campanha.id, usuarioId: dados.usuarioId, fichaId: dados.fichaId}

                connection.query('insert into campanha_jogadores set ?', jogador, (error, results)=>{
                    if(error){ console.log(error.message); return callback({'error': 'Erro no servidor. Tente de novo.'}) }

                    connection.end()
                    callback({'message': 'Você entrou na campanha!', id: campanha.id})
                })
            })
        })
    }

    // O jogador sai da campanha
    static sair(campanhaId, usuarioId, callback){
        const connection = CampanhasBD.connect()

        var sql = 'delete from campanha_jogadores where campanhaId = ? and usuarioId = ?'

        connection.query(sql, [campanhaId, usuarioId], (error, results)=>{
            if(error){ console.log(error.message); return callback({'error': 'Erro no servidor. Tente de novo.'}) }

            callback({'message': 'Você saiu da campanha.'})
        })

        connection.end()
    }

    // ---------- MONSTROS DA CAMPANHA ----------
    // O Mestre coloca um monstro na campanha
    // dados: { campanhaId, monstroId, usuarioId }
    static addMonstro(dados, callback){
        const connection = CampanhasBD.connect()

        // só o Mestre pode
        var sql = 'select id from campanhas where id = ? and usuarioMestreId = ?'

        connection.query(sql, [dados.campanhaId, dados.usuarioId], (error, results)=>{
            if(error){ console.log(error.message); return callback({'error': 'Erro no servidor. Tente de novo.'}) }

            if(results.length == 0){
                connection.end()
                return callback({'error': 'Só o Mestre pode mexer nos monstros da campanha'})
            }

            // versão servidor: o monstro tem que ser um que o Mestre pode ver
            // (oficial, público ou dele mesmo). Assim ninguém coloca o monstro privado de outra pessoa.
            var sql = 'select id from monstros where id = ? and (usuarioId is null or publico = 1 or usuarioId = ?)'

            connection.query(sql, [dados.monstroId, dados.usuarioId], (error, results)=>{
                if(error){ console.log(error.message); return callback({'error': 'Erro no servidor. Tente de novo.'}) }

                if(results.length == 0){
                    return callback({'error': 'Monstro não encontrado'})
                }

                var linha = {campanhaId: dados.campanhaId, monstroId: dados.monstroId}

                connection.query('insert into campanha_monstros set ?', linha, (error, results)=>{
                    if(error){ console.log(error.message); return callback({'error': 'Erro no servidor. Tente de novo.'}) }

                    connection.end()
                    callback({'message': 'Monstro adicionado!'})
                })
            })
        })
    }

    // O Mestre tira um monstro da campanha. linhaId: id da linha em campanha_monstros
    static removerMonstro(linhaId, usuarioId, callback){
        const connection = CampanhasBD.connect()

        // o "in (...)" garante que a linha é de uma campanha em que a pessoa é Mestre
        var sql = 'delete from campanha_monstros where id = ? and campanhaId in (select id from campanhas where usuarioMestreId = ?)'

        connection.query(sql, [linhaId, usuarioId], (error, results)=>{
            if(error){ console.log(error.message); return callback({'error': 'Erro no servidor. Tente de novo.'}) }

            if(results.affectedRows == 0){
                callback({'error': 'Só o Mestre pode mexer nos monstros da campanha'})
            }else{
                callback({'message': 'Monstro removido!'})
            }
        })

        connection.end()
    }

    // ---------- ADMIN: CAMPANHAS OFICIAIS ----------
    // campanha: { nome, descricao, historia, imagemCapa, criadaPor }
    static addOficial(campanha, callback){

        if(!campanha.nome){
            return callback({'error': 'Dê um nome para a campanha'})
        }

        var nova = {
            usuarioMestreId: null,
            nome: campanha.nome,
            descricao: campanha.descricao,
            historia: campanha.historia,
            imagemCapa: campanha.imagemCapa,
            oficial: 1,
            criadaPor: campanha.criadaPor
        }

        const connection = CampanhasBD.connect()

        connection.query('insert into campanhas set ?', nova, (error, results)=>{
            if(error){ console.log(error.message); return callback({'error': 'Erro no servidor. Tente de novo.'}) }

            callback({'message': 'Campanha oficial criada!'})
        })

        connection.end()
    }

    // campanha: { id, nome, descricao, historia, criadaPor, imagemCapa }
    // Se a imagem vier vazia, a capa que já estava no banco continua.
    static atualizarOficial(campanha, callback){

        if(!campanha.nome){
            return callback({'error': 'Dê um nome para a campanha'})
        }

        var sql = 'update campanhas set nome = ?, descricao = ?, historia = ?, criadaPor = ? where id = ? and oficial = 1'
        var valores = [campanha.nome, campanha.descricao, campanha.historia, campanha.criadaPor, campanha.id]

        if(campanha.imagemCapa){
            sql = 'update campanhas set nome = ?, descricao = ?, historia = ?, criadaPor = ?, imagemCapa = ? where id = ? and oficial = 1'
            valores = [campanha.nome, campanha.descricao, campanha.historia, campanha.criadaPor, campanha.imagemCapa, campanha.id]
        }

        const connection = CampanhasBD.connect()

        connection.query(sql, valores, (error, results)=>{
            if(error){ console.log(error.message); return callback({'error': 'Erro no servidor. Tente de novo.'}) }

            // nenhuma linha mudou = esse id não existe (ou não é oficial)
            if(results.affectedRows == 0){
                return callback({'error': 'Campanha oficial não encontrada'})
            }

            callback({'message': 'Campanha oficial salva!'})
        })

        connection.end()
    }

    // Os monstros daquela campanha oficial são apagados junto (ON DELETE CASCADE no banco.sql)
    static excluirOficial(id, callback){
        const connection = CampanhasBD.connect()

        connection.query('delete from campanhas where id = ? and oficial = 1', [id], (error, results)=>{
            if(error){ console.log(error.message); return callback({'error': 'Erro no servidor. Tente de novo.'}) }

            // nenhuma linha apagada = esse id não existe (ou não é oficial)
            if(results.affectedRows == 0){
                return callback({'error': 'Campanha oficial não encontrada'})
            }

            callback({'message': 'Campanha oficial excluída!'})
        })

        connection.end()
    }
}

module.exports = CampanhasBD
