// conexao.js  (VERSÃO SERVIDOR)
// Um "pool" é um grupo de conexões com o banco que ficam prontas e são reaproveitadas.
// Na versão da aula cada função abre e fecha uma conexão (createConnection / end).
// No servidor isso é perigoso: se alguma coisa der erro antes do end(), a conexão
// fica aberta para sempre e, depois de algumas, o banco para de aceitar pedidos.
// Com o pool, o próprio mysql abre, devolve e fecha as conexões sozinho.

const mysql = require('mysql2')   // mysql2: igual ao mysql, mas funciona com o MySQL 8 do Aiven
const config = require('./config')

// Na Vercel (process.env.VERCEL existe só lá) cada cópia do site abre o próprio pool.
// O banco grátis do Aiven aceita poucas conexões, então lá usamos no máximo 2
// e fechamos as que ficam paradas. No computador e no Render continua igual.
var opcoes = Object.assign({}, config)

if(process.env.VERCEL){
    opcoes.connectionLimit = 2
    opcoes.maxIdle = 0
    opcoes.idleTimeout = 5000
}

const pool = mysql.createPool(opcoes)

// As classes continuam usando connection.query(...) e connection.end() igual antes.
// O query vai para o pool, e o end() não faz nada (quem cuida é o pool).
module.exports = {
    query: function(sql, valores, callback){
        return pool.query(sql, valores, callback)
    },
    end: function(){}
}
