const conexao = require('./conexao')

class ClassesBD{

    static connect(){
        return conexao
    }

    static getClasses(usuarioId, tipo, callback){
        const connection = ClassesBD.connect()

        var sql = `
                      select c.*, u.nomeUsuario as autor,
                   (select count(*) from eventos e
                    where e.tema = c.tema
                    and date_sub(utc_timestamp(), interval 3 hour) between e.inicio and date_add(e.inicio, interval 7 day)) as novo
            from classes c
            left join usuarios u on u.id = c.usuarioId
            where (c.usuarioId is null or c.publico = 1 or c.usuarioId = ?)
            and (c.tema is null
                 or c.tema in (select tema from eventos
                               where date_sub(utc_timestamp(), interval 3 hour) between inicio and fim)
                 or ? = 'admin')
            order by c.id`

        connection.query(sql, [usuarioId, tipo], (error, results)=>{
            if(error){ console.log(error.message); return callback({'error': 'Erro no servidor. Tente de novo.'}) }

            callback(results)
        })

        connection.end()
    }

    static addClasse(classe, callback){

        if(!classe.nome){
            return callback({'error': 'Digite o nome da classe'})
        }

        var publico = 0

        if(classe.publico){
            publico = 1
        }

        var nova = {
            usuarioId: classe.usuarioId,
            nome: classe.nome,
            descricao: classe.descricao,
            imagem: classe.imagem,
            publico: publico
        }

        const connection = ClassesBD.connect()

        connection.query('insert into classes set ?', nova, (error, results)=>{
            if(error){ console.log(error.message); return callback({'error': 'Erro no servidor. Tente de novo.'}) }

            callback({'message': 'Classe criada!'})
        })

        connection.end()
    }

    static atualizar(classe, usuarioId, callback){
        const connection = ClassesBD.connect()

        var publico = 0

        if(classe.publico){
            publico = 1
        }

        var sql = 'update classes set descricao = ?, publico = ? where id = ? and usuarioId = ?'

        connection.query(sql, [classe.descricao, publico, classe.id, usuarioId], (error, results)=>{
            if(error){ console.log(error.message); return callback({'error': 'Erro no servidor. Tente de novo.'}) }

            if(results.affectedRows == 0){
                callback({'error': 'Classe não encontrada'})
            }else{
                callback({'message': 'Classe salva!'})
            }
        })

        connection.end()
    }

    static excluir(id, usuarioId, callback){
        const connection = ClassesBD.connect()

        connection.query('select id from fichas where classeId = ?', [id], (error, results)=>{
            if(error){ console.log(error.message); return callback({'error': 'Erro no servidor. Tente de novo.'}) }

            if(results.length > 0){
                connection.end()
                return callback({'error': 'Não dá para excluir: já existe ficha usando esta classe.'})
            }

            connection.query('delete from classes where id = ? and usuarioId = ?', [id, usuarioId], (error, results)=>{
                if(error){ console.log(error.message); return callback({'error': 'Erro no servidor. Tente de novo.'}) }

                connection.end()

                if(results.affectedRows == 0){
                    callback({'error': 'Classe não encontrada'})
                }else{
                    callback({'message': 'Classe excluída!'})
                }
            })
        })
    }

    static addOficial(classe, callback){

        if(!classe.nome){
            return callback({'error': 'Digite o nome da classe'})
        }

        var tema = null

        if(classe.tema){
            tema = classe.tema
        }

        var nova = {
            usuarioId: null,
            nome: classe.nome,
            descricao: classe.descricao,
            imagem: classe.imagem,
            publico: 1,
            tema: tema
        }

        const connection = ClassesBD.connect()

        connection.query('insert into classes set ?', nova, (error, results)=>{
            if(error){ console.log(error.message); return callback({'error': 'Erro no servidor. Tente de novo.'}) }

            callback({'message': 'Classe oficial criada!'})
        })

        connection.end()
    }

    static atualizarOficial(classe, callback){

        if(!classe.nome){
            return callback({'error': 'Digite o nome da classe'})
        }

        var tema = null

        if(classe.tema){
            tema = classe.tema
        }

        var sql = 'update classes set nome = ?, descricao = ?, tema = ? where id = ? and usuarioId is null'
        var valores = [classe.nome, classe.descricao, tema, classe.id]

        if(classe.imagem){
            sql = 'update classes set nome = ?, descricao = ?, tema = ?, imagem = ? where id = ? and usuarioId is null'
            valores = [classe.nome, classe.descricao, tema, classe.imagem, classe.id]
        }

        const connection = ClassesBD.connect()

        connection.query(sql, valores, (error, results)=>{
            if(error){ console.log(error.message); return callback({'error': 'Erro no servidor. Tente de novo.'}) }

            if(results.affectedRows == 0){
                callback({'error': 'Classe oficial não encontrada'})
            }else{
                callback({'message': 'Classe oficial salva!'})
            }
        })

        connection.end()
    }

    static excluirOficial(id, callback){
        const connection = ClassesBD.connect()

        connection.query('select id from fichas where classeId = ?', [id], (error, results)=>{
            if(error){ console.log(error.message); return callback({'error': 'Erro no servidor. Tente de novo.'}) }

            if(results.length > 0){
                return callback({'error': 'Não dá para excluir: já existe ficha usando esta classe.'})
            }

            connection.query('delete from classes where id = ? and usuarioId is null', [id], (error, results)=>{
                if(error){ console.log(error.message); return callback({'error': 'Erro no servidor. Tente de novo.'}) }

                if(results.affectedRows == 0){
                    callback({'error': 'Classe oficial não encontrada'})
                }else{
                    callback({'message': 'Classe oficial excluída!'})
                }
            })
        })
    }
}

module.exports = ClassesBD
