// MonstrosBD.js
// Tabela "monstros" (o Bestiário).
//   usuarioId vazio (NULL)        -> monstro oficial (só o admin mexe)
//   campanhaOficialId preenchido  -> monstro oficial DAQUELA campanha oficial
//   usuarioId preenchido          -> monstro criado por um jogador
//   publico = 1                   -> aparece para todo mundo

const conexao = require('./conexao')

class MonstrosBD{

    static connect(){
        // versão servidor: usa o pool (veja database/conexao.js)
        return conexao
    }

    // Os monstros que a pessoa pode ver: os oficiais, os públicos e os dela.
    // Os LEFT JOINs trazem o nome de quem criou e o nome da campanha oficial
    // (quando o monstro não tem um dos dois, a coluna vem vazia).
    // Os LEFT JOINs trazem o nome de quem criou e o nome da campanha oficial.
    // E o tema: só aparece se não tiver tema, se for do evento de agora, ou para o admin.
    static getMonstros(usuarioId, tipo, callback){
        const connection = MonstrosBD.connect()

        var sql = `
                        select m.*, u.nomeUsuario as autor, c.nome as campanhaOficial,
                   (select count(*) from eventos e
                    where e.tema = m.tema
                    and date_sub(utc_timestamp(), interval 3 hour) between e.inicio and date_add(e.inicio, interval 7 day)) as novo
            from monstros m
            left join usuarios u on u.id = m.usuarioId
            left join campanhas c on c.id = m.campanhaOficialId
            where (m.usuarioId is null or m.publico = 1 or m.usuarioId = ?)
            and (m.tema is null
                 or m.tema in (select tema from eventos
                               where date_sub(utc_timestamp(), interval 3 hour) between inicio and fim)
                 or ? = 'admin')
            order by m.id`

        connection.query(sql, [usuarioId, tipo], (error, results)=>{
            if(error){ console.log(error.message); return callback({'error': 'Erro no servidor. Tente de novo.'}) }

            callback(results)
        })

        connection.end()
    }
    // monstro: { nome, imagem, descricao, vidaMaxima, defesa, publico, usuarioId }
    static addMonstro(monstro, callback){

        if(!monstro.nome){
            return callback({'error': 'Digite o nome do monstro'})
        }

        if(!(Number(monstro.vidaMaxima) >= 1 && Number(monstro.vidaMaxima) <= 1000)){
            return callback({'error': 'A vida do monstro precisa ser de 1 a 1000'})
        }

        if(!(Number(monstro.defesa) >= 0 && Number(monstro.defesa) <= 1000)){
            return callback({'error': 'A defesa do monstro precisa ser de 0 a 1000'})
        }

        // a caixinha "público": marcada vira 1, desmarcada vira 0
        var publico = 0

        if(monstro.publico){
            publico = 1
        }

        var novo = {
            usuarioId: monstro.usuarioId,
            nome: monstro.nome,
            imagem: monstro.imagem,
            descricao: monstro.descricao,
            vidaMaxima: monstro.vidaMaxima,
            defesa: monstro.defesa,
            publico: publico
        }

        const connection = MonstrosBD.connect()

        connection.query('insert into monstros set ?', novo, (error, results)=>{
            if(error){ console.log(error.message); return callback({'error': 'Erro no servidor. Tente de novo.'}) }

            callback({'message': 'Monstro criado com sucesso!'})
        })

        connection.end()
    }

    // Editar: só a descrição e se é público. monstro: { id, descricao, publico }
    static atualizar(monstro, usuarioId, callback){
        const connection = MonstrosBD.connect()

        // a caixinha "público": marcada vira 1, desmarcada vira 0
        var publico = 0

        if(monstro.publico){
            publico = 1
        }

        var sql = 'update monstros set descricao = ?, publico = ? where id = ? and usuarioId = ?'

        connection.query(sql, [monstro.descricao, publico, monstro.id, usuarioId], (error, results)=>{
            if(error){ console.log(error.message); return callback({'error': 'Erro no servidor. Tente de novo.'}) }

            if(results.affectedRows == 0){
                callback({'error': 'Monstro não encontrado'})
            }else{
                callback({'message': 'Monstro salvo!'})
            }
        })

        connection.end()
    }

    // Só exclui se o monstro for de quem pediu
    static excluir(id, usuarioId, callback){
        const connection = MonstrosBD.connect()

        connection.query('delete from monstros where id = ? and usuarioId = ?', [id, usuarioId], (error, results)=>{
            if(error){ console.log(error.message); return callback({'error': 'Erro no servidor. Tente de novo.'}) }

            if(results.affectedRows == 0){
                callback({'error': 'Monstro não encontrado'})
            }else{
                callback({'message': 'Monstro excluído!'})
            }
        })

        connection.end()
    }

    // ---------- ADMIN: MONSTROS OFICIAIS ----------
    // monstro: { nome, imagem, descricao, vidaMaxima, defesa, campanhaOficialId }
    // campanhaOficialId vazio = monstro geral da Peak
    static addOficial(monstro, callback){

        if(!monstro.nome){
            return callback({'error': 'Digite o nome do monstro'})
        }

        if(!(Number(monstro.vidaMaxima) >= 1 && Number(monstro.vidaMaxima) <= 1000)){
            return callback({'error': 'A vida do monstro precisa ser de 1 a 1000'})
        }

        if(!(Number(monstro.defesa) >= 0 && Number(monstro.defesa) <= 1000)){
            return callback({'error': 'A defesa do monstro precisa ser de 0 a 1000'})
        }

        // '' (não marcado) vira null = aparece sempre; 'natal' = só aparece no evento
        var tema = null

        if(monstro.tema){
            tema = monstro.tema
        }

        // sem campanha escolhida, fica vazio (null) = monstro da Peak para qualquer campanha
        var campanhaOficialId = null

        if(monstro.campanhaOficialId){
            campanhaOficialId = monstro.campanhaOficialId
        }

        var novo = {
            usuarioId: null,
            campanhaOficialId: campanhaOficialId,
            nome: monstro.nome,
            imagem: monstro.imagem,
            descricao: monstro.descricao,
            vidaMaxima: monstro.vidaMaxima,
            defesa: monstro.defesa,
            publico: 1,
            tema: tema
        }

        const connection = MonstrosBD.connect()

        connection.query('insert into monstros set ?', novo, (error, results)=>{
            if(error){ console.log(error.message); return callback({'error': 'Erro no servidor. Tente de novo.'}) }

            callback({'message': 'Monstro oficial criado!'})
        })

        connection.end()
    }

    // monstro: { id, nome, descricao, vidaMaxima, defesa, campanhaOficialId, imagem }
    // Se a imagem vier vazia, a imagem que já estava no banco continua.
    static atualizarOficial(monstro, callback){

        if(!monstro.nome){
            return callback({'error': 'Digite o nome do monstro'})
        }

        if(!(Number(monstro.vidaMaxima) >= 1 && Number(monstro.vidaMaxima) <= 1000)){
            return callback({'error': 'A vida do monstro precisa ser de 1 a 1000'})
        }

        if(!(Number(monstro.defesa) >= 0 && Number(monstro.defesa) <= 1000)){
            return callback({'error': 'A defesa do monstro precisa ser de 0 a 1000'})
        }

        // '' (não marcado) vira null = aparece sempre; 'natal' = só aparece no evento
        var tema = null

        if(monstro.tema){
            tema = monstro.tema
        }

        // sem campanha escolhida, fica vazio (null) = monstro da Peak para qualquer campanha
        var campanhaOficialId = null

        if(monstro.campanhaOficialId){
            campanhaOficialId = monstro.campanhaOficialId
        }

        var sql = 'update monstros set nome = ?, descricao = ?, vidaMaxima = ?, defesa = ?, campanhaOficialId = ?, tema = ? where id = ? and usuarioId is null'
        var valores = [monstro.nome, monstro.descricao, monstro.vidaMaxima, monstro.defesa, campanhaOficialId, tema, monstro.id]

        if(monstro.imagem){
            sql = 'update monstros set nome = ?, descricao = ?, vidaMaxima = ?, defesa = ?, campanhaOficialId = ?, tema = ?, imagem = ? where id = ? and usuarioId is null'
            valores = [monstro.nome, monstro.descricao, monstro.vidaMaxima, monstro.defesa, campanhaOficialId, tema, monstro.imagem, monstro.id]
        }

        const connection = MonstrosBD.connect()

        connection.query(sql, valores, (error, results)=>{
            if(error){ console.log(error.message); return callback({'error': 'Erro no servidor. Tente de novo.'}) }

            // nenhuma linha mudou = esse id não existe (ou não é oficial)
            if(results.affectedRows == 0){
                callback({'error': 'Monstro oficial não encontrado'})
            }else{
                callback({'message': 'Monstro oficial salvo!'})
            }
        })

        connection.end()
    }

    static excluirOficial(id, callback){
        const connection = MonstrosBD.connect()

        connection.query('delete from monstros where id = ? and usuarioId is null', [id], (error, results)=>{
            if(error){ console.log(error.message); return callback({'error': 'Erro no servidor. Tente de novo.'}) }

            // nenhuma linha mudou = esse id não existe (ou não é oficial)
            if(results.affectedRows == 0){
                callback({'error': 'Monstro oficial não encontrado'})
            }else{
                callback({'message': 'Monstro oficial excluído!'})
            }
        })

        connection.end()
    }
}

module.exports = MonstrosBD
