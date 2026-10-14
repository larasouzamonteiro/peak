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
    static getMonstros(usuarioId, callback){
        const connection = MonstrosBD.connect()

        var sql = `
            select m.*, u.nomeUsuario as autor, c.nome as campanhaOficial
            from monstros m
            left join usuarios u on u.id = m.usuarioId
            left join campanhas c on c.id = m.campanhaOficialId
            where m.usuarioId is null or m.publico = 1 or m.usuarioId = ?
            order by m.id`

        connection.query(sql, [usuarioId], (error, results)=>{
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

        if(!(Number(monstro.vidaMaxima) >= 1) || !(Number(monstro.defesa) >= 0)){
            return callback({'error': 'Confira a vida e a defesa do monstro'})
        }

        var novo = {
            usuarioId: monstro.usuarioId,
            nome: monstro.nome,
            imagem: monstro.imagem,
            descricao: monstro.descricao,
            vidaMaxima: monstro.vidaMaxima,
            defesa: monstro.defesa,
            publico: monstro.publico ? 1 : 0
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

        var sql = 'update monstros set descricao = ?, publico = ? where id = ? and usuarioId = ?'

        connection.query(sql, [monstro.descricao, monstro.publico ? 1 : 0, monstro.id, usuarioId], (error, results)=>{
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

        if(!(Number(monstro.vidaMaxima) >= 1) || !(Number(monstro.defesa) >= 0)){
            return callback({'error': 'Confira a vida e a defesa do monstro'})
        }

        var novo = {
            usuarioId: null,
            campanhaOficialId: monstro.campanhaOficialId || null,
            nome: monstro.nome,
            imagem: monstro.imagem,
            descricao: monstro.descricao,
            vidaMaxima: monstro.vidaMaxima,
            defesa: monstro.defesa,
            publico: 1
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

        if(!(Number(monstro.vidaMaxima) >= 1) || !(Number(monstro.defesa) >= 0)){
            return callback({'error': 'Confira a vida e a defesa do monstro'})
        }

        var sql = 'update monstros set nome = ?, descricao = ?, vidaMaxima = ?, defesa = ?, campanhaOficialId = ? where id = ? and usuarioId is null'
        var valores = [monstro.nome, monstro.descricao, monstro.vidaMaxima, monstro.defesa, monstro.campanhaOficialId || null, monstro.id]

        if(monstro.imagem){
            sql = 'update monstros set nome = ?, descricao = ?, vidaMaxima = ?, defesa = ?, campanhaOficialId = ?, imagem = ? where id = ? and usuarioId is null'
            valores = [monstro.nome, monstro.descricao, monstro.vidaMaxima, monstro.defesa, monstro.campanhaOficialId || null, monstro.imagem, monstro.id]
        }

        const connection = MonstrosBD.connect()

        connection.query(sql, valores, (error, results)=>{
            if(error){ console.log(error.message); return callback({'error': 'Erro no servidor. Tente de novo.'}) }

            callback({'message': 'Monstro oficial salvo!'})
        })

        connection.end()
    }

    static excluirOficial(id, callback){
        const connection = MonstrosBD.connect()

        connection.query('delete from monstros where id = ? and usuarioId is null', [id], (error, results)=>{
            if(error){ console.log(error.message); return callback({'error': 'Erro no servidor. Tente de novo.'}) }

            callback({'message': 'Monstro oficial excluído!'})
        })

        connection.end()
    }
}

module.exports = MonstrosBD
