// conexao.js  (VERSÃO SERVIDOR)
// Um "pool" é um grupo de conexões com o banco que ficam prontas e são reaproveitadas.
// Na versão da aula cada função abre e fecha uma conexão (createConnection / end).
// No servidor isso é perigoso: se alguma coisa der erro antes do end(), a conexão
// fica aberta para sempre e, depois de algumas, o banco para de aceitar pedidos.
// Com o pool, o próprio mysql abre, devolve e fecha as conexões sozinho.

const mysql = require('mysql2')   // mysql2: igual ao mysql, mas funciona com o MySQL 8 do Aiven
const config = require('./config')

const pool = mysql.createPool(config)

// As classes continuam usando connection.query(...) e connection.end() igual antes.
// O query vai para o pool, e o end() não faz nada (quem cuida é o pool).
module.exports = {
    query: function(sql, valores, callback){
        return pool.query(sql, valores, callback)
    },
    end: function(){}
}
