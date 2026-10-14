// SessoesBD.js
// Tabela "sessoes": cada encontro de jogo de uma campanha (nome, data, o que aconteceu).
// Só o Mestre cria e exclui sessões.

const conexao = require('./conexao')

class SessoesBD{

    static connect(){
        // versão servidor: usa o pool (veja database/conexao.js)
        return conexao
    }

    // As sessões de UMA campanha, da mais nova para a mais antiga
    // (versão servidor: só quem participa da campanha consegue ver)
    static getSessoes(campanhaId, usuarioId, callback){
        const connection = SessoesBD.connect()

        var sql = 'select * from sessoes where campanhaId = ? and campanhaId in (select id from campanhas where usuarioMestreId = ? union select campanhaId from campanha_jogadores where usuarioId = ?) order by data desc, id desc'

        connection.query(sql, [campanhaId, usuarioId, usuarioId], (error, results)=>{
            if(error){ console.log(error.message); return callback({'error': 'Erro no servidor. Tente de novo.'}) }

            callback(results)
        })

        connection.end()
    }

    // sessao: { campanhaId, nome, data, descricao, resultado, usuarioId }
    static addSessao(sessao, callback){

        if(!sessao.nome || !sessao.data){
            return callback({'error': 'Digite o nome e a data da sessão'})
        }

        const connection = SessoesBD.connect()

        // só o Mestre da campanha pode criar sessão
        var sql = 'select id from campanhas where id = ? and usuarioMestreId = ?'

        connection.query(sql, [sessao.campanhaId, sessao.usuarioId], (error, results)=>{
            if(error){ console.log(error.message); return callback({'error': 'Erro no servidor. Tente de novo.'}) }

            if(results.length == 0){
                connection.end()
                return callback({'error': 'Só o Mestre pode criar sessões'})
            }

            var nova = {
                campanhaId: sessao.campanhaId,
                nome: sessao.nome,
                data: sessao.data,
                descricao: sessao.descricao,
                resultado: sessao.resultado
            }

            connection.query('insert into sessoes set ?', nova, (error, results)=>{
                if(error){ console.log(error.message); return callback({'error': 'Erro no servidor. Tente de novo.'}) }

                connection.end()
                callback({'message': 'Sessão salva!'})
            })
        })
    }

    static excluir(id, usuarioId, callback){
        const connection = SessoesBD.connect()

        // o "in (...)" garante que a sessão é de uma campanha em que a pessoa é Mestre
        var sql = 'delete from sessoes where id = ? and campanhaId in (select id from campanhas where usuarioMestreId = ?)'

        connection.query(sql, [id, usuarioId], (error, results)=>{
            if(error){ console.log(error.message); return callback({'error': 'Erro no servidor. Tente de novo.'}) }

            if(results.affectedRows == 0){
                callback({'error': 'Só o Mestre pode excluir sessões'})
            }else{
                callback({'message': 'Sessão excluída!'})
            }
        })

        connection.end()
    }
}

module.exports = SessoesBD
