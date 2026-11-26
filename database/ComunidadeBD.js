

const conexao = require('./conexao')

class ComunidadeBD{

    static connect(){
    
        return conexao
    }

  
    static getInteresses(callback){
        const connection = ComunidadeBD.connect()

        connection.query('select * from interesses order by nome', (error, results)=>{
            if(error){ console.log(error.message); return callback({'error': 'Erro no servidor. Tente de novo.'}) }

            callback(results)
        })

        connection.end()
    }

 
    static getInteressesDoUsuario(usuarioId, callback){
        const connection = ComunidadeBD.connect()

  
        var sql = `
            select i.id, i.nome
            from usuario_interesses ui
            join interesses i on i.id = ui.interesseId
            where ui.usuarioId = ?
            order by i.nome`

        connection.query(sql, [usuarioId], (error, results)=>{
            if(error){ console.log(error.message); return callback({'error': 'Erro no servidor. Tente de novo.'}) }

            callback(results)
        })

        connection.end()
    }

    static addInteresse(interesseId, usuarioId, callback){
        const connection = ComunidadeBD.connect()


        var sql = 'select id from usuario_interesses where usuarioId = ? and interesseId = ?'

        connection.query(sql, [usuarioId, interesseId], (error, results)=>{
            if(error){ console.log(error.message); return callback({'error': 'Erro no servidor. Tente de novo.'}) }

            if(results.length > 0){
                connection.end()
                return callback({'message': 'Interesse já estava marcado.'})
            }

            var novo = {usuarioId: usuarioId, interesseId: interesseId}

            connection.query('insert into usuario_interesses set ?', novo, (error, results)=>{
                if(error){ console.log(error.message); return callback({'error': 'Erro no servidor. Tente de novo.'}) }

                connection.end()
                callback({'message': 'Interesse adicionado!'})
            })
        })
    }

    static removerInteresse(interesseId, usuarioId, callback){
        const connection = ComunidadeBD.connect()

        var sql = 'delete from usuario_interesses where usuarioId = ? and interesseId = ?'

        connection.query(sql, [usuarioId, interesseId], (error, results)=>{
            if(error){ console.log(error.message); return callback({'error': 'Erro no servidor. Tente de novo.'}) }

            callback({'message': 'Interesse removido!'})
        })

        connection.end()
    }

    static getParcerias(callback){
        const connection = ComunidadeBD.connect()

        connection.query('select * from parcerias order by id', (error, results)=>{
            if(error){ console.log(error.message); return callback({'error': 'Erro no servidor. Tente de novo.'}) }

            callback(results)
        })

        connection.end()
    }

    static getParceriasDoUsuario(usuarioId, callback){
        const connection = ComunidadeBD.connect()

        var sql = `
            select p.id, p.nome, up.tipo
            from usuario_parcerias up
            join parcerias p on p.id = up.parceriaId
            where up.usuarioId = ?
            order by p.id`

        connection.query(sql, [usuarioId], (error, results)=>{
            if(error){ console.log(error.message); return callback({'error': 'Erro no servidor. Tente de novo.'}) }

            callback(results)
        })

        connection.end()
    }


    static addParceria(dados, usuarioId, callback){
        var {parceriaId, tipo} = dados

        if(tipo != 'sou' && tipo != 'procuro'){
            return callback({'error': 'Tipo de parceria inválido'})
        }

        const connection = ComunidadeBD.connect()

        var sql = 'select id from usuario_parcerias where usuarioId = ? and parceriaId = ? and tipo = ?'

        connection.query(sql, [usuarioId, parceriaId, tipo], (error, results)=>{
            if(error){ console.log(error.message); return callback({'error': 'Erro no servidor. Tente de novo.'}) }

            if(results.length > 0){
                connection.end()
                return callback({'message': 'Parceria já estava marcada.'})
            }

            var nova = {usuarioId: usuarioId, parceriaId: parceriaId, tipo: tipo}

            connection.query('insert into usuario_parcerias set ?', nova, (error, results)=>{
                if(error){ console.log(error.message); return callback({'error': 'Erro no servidor. Tente de novo.'}) }

                connection.end()
                callback({'message': 'Parceria marcada!'})
            })
        })
    }

    static removerParceria(dados, usuarioId, callback){
        const connection = ComunidadeBD.connect()

        var sql = 'delete from usuario_parcerias where usuarioId = ? and parceriaId = ? and tipo = ?'

        connection.query(sql, [usuarioId, dados.parceriaId, dados.tipo], (error, results)=>{
            if(error){ console.log(error.message); return callback({'error': 'Erro no servidor. Tente de novo.'}) }

            callback({'message': 'Parceria desmarcada!'})
        })

        connection.end()
    }

 
    static getPessoas(callback){
        const connection = ComunidadeBD.connect()

        var sql = 'select id, nomeUsuario, fotoPerfil from usuarios where emailVerificado = 1 order by nomeUsuario'

        connection.query(sql, (error, results)=>{
            if(error){ console.log(error.message); return callback({'error': 'Erro no servidor. Tente de novo.'}) }

            callback(results)
        })

        connection.end()
    }

   
    static getTodosInteresses(callback){
        const connection = ComunidadeBD.connect()

        var sql = `
            select ui.usuarioId, i.nome
            from usuario_interesses ui
            join interesses i on i.id = ui.interesseId`

        connection.query(sql, (error, results)=>{
            if(error){ console.log(error.message); return callback({'error': 'Erro no servidor. Tente de novo.'}) }

            callback(results)
        })

        connection.end()
    }

    static getTodasParcerias(callback){
        const connection = ComunidadeBD.connect()

        var sql = `
            select up.usuarioId, p.nome, up.tipo
            from usuario_parcerias up
            join parcerias p on p.id = up.parceriaId`

        connection.query(sql, (error, results)=>{
            if(error){ console.log(error.message); return callback({'error': 'Erro no servidor. Tente de novo.'}) }

            callback(results)
        })

        connection.end()
    }
}

module.exports = ComunidadeBD
