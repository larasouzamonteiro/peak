// ComunidadeBD.js
// Interesses e parcerias dos usuários, e as listas da página Comunidade.
//
// Tabelas usadas:
//   interesses / usuario_interesses  -> o que cada pessoa gosta
//   parcerias  / usuario_parcerias   -> o que cada pessoa É ('sou') e o que PROCURA ('procuro')

const conexao = require('./conexao')

class ComunidadeBD{

    static connect(){
        // versão servidor: usa o pool (veja database/conexao.js)
        return conexao
    }

    // ---------- INTERESSES ----------
    // Todos os interesses que existem (para a pessoa escolher)
    static getInteresses(callback){
        const connection = ComunidadeBD.connect()

        connection.query('select * from interesses order by nome', (error, results)=>{
            if(error){ console.log(error.message); return callback({'error': 'Erro no servidor. Tente de novo.'}) }

            callback(results)
        })

        connection.end()
    }

    // Os interesses de UMA pessoa
    static getInteressesDoUsuario(usuarioId, callback){
        const connection = ComunidadeBD.connect()

        // o JOIN junta as duas tabelas: usuario_interesses só tem números (ids),
        // e o nome de cada interesse está na tabela interesses
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

        // primeiro confere se a pessoa já não marcou este interesse
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

    // ---------- PARCERIAS ----------
    // Todas as parcerias que existem (Ilustrador, Mestre...)
    static getParcerias(callback){
        const connection = ComunidadeBD.connect()

        connection.query('select * from parcerias order by id', (error, results)=>{
            if(error){ console.log(error.message); return callback({'error': 'Erro no servidor. Tente de novo.'}) }

            callback(results)
        })

        connection.end()
    }

    // As parcerias de UMA pessoa. Cada linha vem com o tipo: 'sou' ou 'procuro'
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

    // dados: { parceriaId, tipo }   tipo = 'sou' ou 'procuro'
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

    // ---------- PÁGINA COMUNIDADE ----------
    // A página pede três listas e junta tudo lá (js/comunidade.js):

    // 1. as pessoas (todas com o e-mail confirmado)
    static getPessoas(callback){
        const connection = ComunidadeBD.connect()

        var sql = 'select id, nomeUsuario, fotoPerfil from usuarios where emailVerificado = 1 order by nomeUsuario'

        connection.query(sql, (error, results)=>{
            if(error){ console.log(error.message); return callback({'error': 'Erro no servidor. Tente de novo.'}) }

            callback(results)
        })

        connection.end()
    }

    // 2. os interesses de TODO MUNDO: cada linha diz "a pessoa X gosta de Y"
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

    // 3. as parcerias de TODO MUNDO: cada linha diz "a pessoa X é (ou procura) Y"
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
