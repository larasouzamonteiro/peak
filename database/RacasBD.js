// RacasBD.js
// Tabela "racas".
//   usuarioId vazio (NULL) -> raça oficial da Peak
//   usuarioId preenchido   -> raça criada por um jogador
//   publico = 1            -> aparece para todo mundo (em "Comunidade")

const conexao = require('./conexao')

class RacasBD{

    static connect(){
        // versão servidor: usa o pool (veja database/conexao.js)
        return conexao
    }

    // As raças que a pessoa pode ver: as oficiais, as públicas e as dela.
    // LEFT JOIN: traz o nome de quem criou. Nas oficiais não tem ninguém, e o
    // "left" deixa a raça aparecer mesmo assim (com autor vazio).
    static getRacas(usuarioId, callback){
        const connection = RacasBD.connect()

        var sql = `
            select r.*, u.nomeUsuario as autor
            from racas r
            left join usuarios u on u.id = r.usuarioId
            where r.usuarioId is null or r.publico = 1 or r.usuarioId = ?
            order by r.id`

        connection.query(sql, [usuarioId], (error, results)=>{
            if(error){ console.log(error.message); return callback({'error': 'Erro no servidor. Tente de novo.'}) }

            callback(results)
        })

        connection.end()
    }

    // raca: { nome, descricao, vidaMaxima, imagem, publico, usuarioId }
    static addRaca(raca, callback){

        if(!raca.nome){
            return callback({'error': 'Digite o nome da raça'})
        }

        if(!(Number(raca.vidaMaxima) >= 1)){
            return callback({'error': 'A vida precisa ser pelo menos 1'})
        }

        var nova = {
            usuarioId: raca.usuarioId,
            nome: raca.nome,
            descricao: raca.descricao,
            vidaMaxima: raca.vidaMaxima,
            imagem: raca.imagem,
            publico: raca.publico ? 1 : 0
        }

        const connection = RacasBD.connect()

        connection.query('insert into racas set ?', nova, (error, results)=>{
            if(error){ console.log(error.message); return callback({'error': 'Erro no servidor. Tente de novo.'}) }

            callback({'message': 'Raça criada com sucesso!'})
        })

        connection.end()
    }

    // Editar: só a descrição e se é pública. raca: { id, descricao, publico }
    static atualizar(raca, usuarioId, callback){
        const connection = RacasBD.connect()

        var sql = 'update racas set descricao = ?, publico = ? where id = ? and usuarioId = ?'

        connection.query(sql, [raca.descricao, raca.publico ? 1 : 0, raca.id, usuarioId], (error, results)=>{
            if(error){ console.log(error.message); return callback({'error': 'Erro no servidor. Tente de novo.'}) }

            if(results.affectedRows == 0){
                callback({'error': 'Raça não encontrada'})
            }else{
                callback({'message': 'Raça salva!'})
            }
        })

        connection.end()
    }

    static excluir(id, usuarioId, callback){
        const connection = RacasBD.connect()

        // uma raça que já está em alguma ficha não pode ser apagada
        connection.query('select id from fichas where racaId = ?', [id], (error, results)=>{
            if(error){ console.log(error.message); return callback({'error': 'Erro no servidor. Tente de novo.'}) }

            if(results.length > 0){
                connection.end()
                return callback({'error': 'Não dá para excluir: já existe ficha usando esta raça.'})
            }

            connection.query('delete from racas where id = ? and usuarioId = ?', [id, usuarioId], (error, results)=>{
                if(error){ console.log(error.message); return callback({'error': 'Erro no servidor. Tente de novo.'}) }

                connection.end()

                if(results.affectedRows == 0){
                    callback({'error': 'Raça não encontrada'})
                }else{
                    callback({'message': 'Raça excluída!'})
                }
            })
        })
    }

    // ---------- ADMIN: RAÇAS OFICIAIS ----------
    // Raça oficial = usuarioId vazio (NULL). Só o admin cria, edita e apaga.
    // raca: { nome, descricao, vidaMaxima, imagem }
    static addOficial(raca, callback){

        if(!raca.nome){
            return callback({'error': 'Digite o nome da raça'})
        }

        if(!(Number(raca.vidaMaxima) >= 1)){
            return callback({'error': 'A vida precisa ser pelo menos 1'})
        }

        var nova = {
            usuarioId: null,
            nome: raca.nome,
            descricao: raca.descricao,
            vidaMaxima: raca.vidaMaxima,
            imagem: raca.imagem,
            publico: 1
        }

        const connection = RacasBD.connect()

        connection.query('insert into racas set ?', nova, (error, results)=>{
            if(error){ console.log(error.message); return callback({'error': 'Erro no servidor. Tente de novo.'}) }

            callback({'message': 'Raça oficial criada!'})
        })

        connection.end()
    }

    // raca: { id, nome, descricao, vidaMaxima, imagem }
    // Se a imagem vier vazia, a imagem que já estava no banco continua.
    static atualizarOficial(raca, callback){

        if(!raca.nome){
            return callback({'error': 'Digite o nome da raça'})
        }

        if(!(Number(raca.vidaMaxima) >= 1)){
            return callback({'error': 'A vida precisa ser pelo menos 1'})
        }

        var sql = 'update racas set nome = ?, descricao = ?, vidaMaxima = ? where id = ? and usuarioId is null'
        var valores = [raca.nome, raca.descricao, raca.vidaMaxima, raca.id]

        if(raca.imagem){
            sql = 'update racas set nome = ?, descricao = ?, vidaMaxima = ?, imagem = ? where id = ? and usuarioId is null'
            valores = [raca.nome, raca.descricao, raca.vidaMaxima, raca.imagem, raca.id]
        }

        const connection = RacasBD.connect()

        connection.query(sql, valores, (error, results)=>{
            if(error){ console.log(error.message); return callback({'error': 'Erro no servidor. Tente de novo.'}) }

            if(results.affectedRows == 0){
                callback({'error': 'Raça oficial não encontrada'})
            }else{
                callback({'message': 'Raça oficial salva!'})
            }
        })

        connection.end()
    }

    static excluirOficial(id, callback){
        const connection = RacasBD.connect()

        // uma raça que já está em alguma ficha não pode ser apagada
        connection.query('select id from fichas where racaId = ?', [id], (error, results)=>{
            if(error){ console.log(error.message); return callback({'error': 'Erro no servidor. Tente de novo.'}) }

            if(results.length > 0){
                return callback({'error': 'Não dá para excluir: já existe ficha usando esta raça.'})
            }

            connection.query('delete from racas where id = ? and usuarioId is null', [id], (error, results)=>{
                if(error){ console.log(error.message); return callback({'error': 'Erro no servidor. Tente de novo.'}) }

                if(results.affectedRows == 0){
                    callback({'error': 'Raça oficial não encontrada'})
                }else{
                    callback({'message': 'Raça oficial excluída!'})
                }
            })
        })
    }
}

module.exports = RacasBD
