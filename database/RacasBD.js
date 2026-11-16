

const conexao = require('./conexao')

class RacasBD{

    static connect(){
    
        return conexao
    }
    // As raças que a pessoa pode ver: as oficiais, as públicas e as dela.
    // E o tema: só aparece se não tiver tema, se for do evento de agora, ou para o admin.
    static getRacas(usuarioId, tipo, callback){
        const connection = RacasBD.connect()

        var sql = `
            select r.*, u.nomeUsuario as autor,
            (select count(*) from eventos e
            where e.tema = r.tema
            and date_sub(utc_timestamp(), interval 3 hour) between e.inicio and date_add(e.inicio, interval 7 day)) as novo
            from racas r
            left join usuarios u on u.id = r.usuarioId
            where (r.usuarioId is null or r.publico = 1 or r.usuarioId = ?)
            and (r.tema is null
                 or r.tema in (select tema from eventos
                               where date_sub(utc_timestamp(), interval 3 hour) between inicio and fim)
                 or ? = 'admin')
            order by r.id`

        connection.query(sql, [usuarioId, tipo], (error, results)=>{
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

        if(!(Number(raca.vidaMaxima) >= 1 && Number(raca.vidaMaxima) <= 1000)){
            return callback({'error': 'A vida precisa ser de 1 a 1000'})
        }

        // a caixinha "público": marcada vira 1, desmarcada vira 0
        var publico = 0

        if(raca.publico){
            publico = 1
        }

        var nova = {
            usuarioId: raca.usuarioId,
            nome: raca.nome,
            descricao: raca.descricao,
            vidaMaxima: raca.vidaMaxima,
            imagem: raca.imagem,
            publico: publico
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

        // a caixinha "público": marcada vira 1, desmarcada vira 0
        var publico = 0

        if(raca.publico){
            publico = 1
        }

        var sql = 'update racas set descricao = ?, publico = ? where id = ? and usuarioId = ?'

        connection.query(sql, [raca.descricao, publico, raca.id, usuarioId], (error, results)=>{
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

        if(!(Number(raca.vidaMaxima) >= 1 && Number(raca.vidaMaxima) <= 1000)){
            return callback({'error': 'A vida precisa ser de 1 a 1000'})
        }

        // '' (não marcado) vira null = aparece sempre; 'natal' = só aparece no evento
        var tema = null

        if(raca.tema){
            tema = raca.tema
        }

        var nova = {
            usuarioId: null,
            nome: raca.nome,
            descricao: raca.descricao,
            vidaMaxima: raca.vidaMaxima,
            imagem: raca.imagem,
            publico: 1,
            tema: tema
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

        if(!(Number(raca.vidaMaxima) >= 1 && Number(raca.vidaMaxima) <= 1000)){
            return callback({'error': 'A vida precisa ser de 1 a 1000'})
        }

        // '' (não marcado) vira null = aparece sempre; 'natal' = só aparece no evento
        var tema = null

        if(raca.tema){
            tema = raca.tema
        }

        var sql = 'update racas set nome = ?, descricao = ?, vidaMaxima = ?, tema = ? where id = ? and usuarioId is null'
        var valores = [raca.nome, raca.descricao, raca.vidaMaxima, tema, raca.id]

        if(raca.imagem){
            sql = 'update racas set nome = ?, descricao = ?, vidaMaxima = ?, tema = ?, imagem = ? where id = ? and usuarioId is null'
            valores = [raca.nome, raca.descricao, raca.vidaMaxima, tema, raca.imagem, raca.id]
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
