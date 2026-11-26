
const conexao = require('./conexao')

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
        return conexao
    }

    static getCampanhas(usuarioId, callback){
        const connection = CampanhasBD.connect()

        var sql = `
            select c.id, c.nome, c.descricao, c.imagemCapa, c.usuarioMestreId, u.nomeUsuario as mestre,
                   (select o.tema from campanhas o where o.id = c.oficialId) as tema            from campanhas c
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

    static getOficiais(tipo, callback){
        const connection = CampanhasBD.connect()

        var sql = `
            select id, nome, descricao, historia, imagemCapa, criadaPor, tema,
                   (select count(*) from eventos e
                    where e.tema = campanhas.tema
                    and date_sub(utc_timestamp(), interval 3 hour) between e.inicio and date_add(e.inicio, interval 7 day)) as novo            from campanhas
            where oficial = 1
            and (tema is null
                 or tema in (select tema from eventos
                             where date_sub(utc_timestamp(), interval 3 hour) between inicio and fim)
                 or ? = 'admin')
            order by id`

        connection.query(sql, [tipo], (error, results)=>{
            if(error){ console.log(error.message); return callback({'error': 'Erro no servidor. Tente de novo.'}) }

            callback(results)
        })

        connection.end()
    }

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
                if(results[0].usuarioMestreId != usuarioId){
                    results[0].codigoConvite = ''
                }
                callback(results[0])
            }
        })

        connection.end()
    }

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

            callback({'message': 'Campanha criada!', codigo: nova.codigoConvite, id: results.insertId})
        })

        connection.end()
    }

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

    static entrar(dados, callback){

        if(!dados.codigo || !dados.fichaId){
            return callback({'error': 'Digite o código e escolha uma ficha'})
        }

        const connection = CampanhasBD.connect()

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

                var jogador = {campanhaId: campanha.id, usuarioId: dados.usuarioId, fichaId: dados.fichaId}

                connection.query('insert into campanha_jogadores set ?', jogador, (error, results)=>{
                    if(error){ console.log(error.message); return callback({'error': 'Erro no servidor. Tente de novo.'}) }

                    connection.end()
                    callback({'message': 'Você entrou na campanha!', id: campanha.id})
                })
            })
        })
    }

    static sair(campanhaId, usuarioId, callback){
        const connection = CampanhasBD.connect()

        var sql = 'delete from campanha_jogadores where campanhaId = ? and usuarioId = ?'

        connection.query(sql, [campanhaId, usuarioId], (error, results)=>{
            if(error){ console.log(error.message); return callback({'error': 'Erro no servidor. Tente de novo.'}) }

            callback({'message': 'Você saiu da campanha.'})
        })

        connection.end()
    }

    static addMonstro(dados, callback){
        const connection = CampanhasBD.connect()

        var sql = 'select id from campanhas where id = ? and usuarioMestreId = ?'

        connection.query(sql, [dados.campanhaId, dados.usuarioId], (error, results)=>{
            if(error){ console.log(error.message); return callback({'error': 'Erro no servidor. Tente de novo.'}) }

            if(results.length == 0){
                connection.end()
                return callback({'error': 'Só o Mestre pode mexer nos monstros da campanha'})
            }

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

    static removerMonstro(linhaId, usuarioId, callback){
        const connection = CampanhasBD.connect()

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

    static addOficial(campanha, callback){

        if(!campanha.nome){
            return callback({'error': 'Dê um nome para a campanha'})
        }

        var tema = null

        if(campanha.tema){
            tema = campanha.tema
        }

        var nova = {
            usuarioMestreId: null,
            nome: campanha.nome,
            descricao: campanha.descricao,
            historia: campanha.historia,
            imagemCapa: campanha.imagemCapa,
            oficial: 1,
            criadaPor: campanha.criadaPor,
            tema: tema
        }

        const connection = CampanhasBD.connect()

        connection.query('insert into campanhas set ?', nova, (error, results)=>{
            if(error){ console.log(error.message); return callback({'error': 'Erro no servidor. Tente de novo.'}) }

            callback({'message': 'Campanha oficial criada!'})
        })

        connection.end()
    }

    static atualizarOficial(campanha, callback){

        if(!campanha.nome){
            return callback({'error': 'Dê um nome para a campanha'})
        }

        var tema = null

        if(campanha.tema){
            tema = campanha.tema
        }

        var sql = 'update campanhas set nome = ?, descricao = ?, historia = ?, criadaPor = ?, tema = ? where id = ? and oficial = 1'
        var valores = [campanha.nome, campanha.descricao, campanha.historia, campanha.criadaPor, tema, campanha.id]

        if(campanha.imagemCapa){
            sql = 'update campanhas set nome = ?, descricao = ?, historia = ?, criadaPor = ?, tema = ?, imagemCapa = ? where id = ? and oficial = 1'
            valores = [campanha.nome, campanha.descricao, campanha.historia, campanha.criadaPor, tema, campanha.imagemCapa, campanha.id]
        }

        const connection = CampanhasBD.connect()

        connection.query(sql, valores, (error, results)=>{
            if(error){ console.log(error.message); return callback({'error': 'Erro no servidor. Tente de novo.'}) }

            if(results.affectedRows == 0){
                return callback({'error': 'Campanha oficial não encontrada'})
            }

            callback({'message': 'Campanha oficial salva!'})
        })

        connection.end()
    }

    static excluirOficial(id, callback){
        const connection = CampanhasBD.connect()

        connection.query('delete from campanhas where id = ? and oficial = 1', [id], (error, results)=>{
            if(error){ console.log(error.message); return callback({'error': 'Erro no servidor. Tente de novo.'}) }

            if(results.affectedRows == 0){
                return callback({'error': 'Campanha oficial não encontrada'})
            }

            callback({'message': 'Campanha oficial excluída!'})
        })

        connection.end()
    }
}

module.exports = CampanhasBD
