// ClassesBD.js
// Tabela "classes". Funciona igual às raças:
//   usuarioId vazio (NULL) -> classe oficial da Peak
//   usuarioId preenchido   -> classe criada por um jogador
//   publico = 1            -> aparece para todo mundo (em "Comunidade")

const conexao = require('./conexao')

class ClassesBD{

    static connect(){
        // versão servidor: usa o pool (veja database/conexao.js)
        return conexao
    }

    // As classes que a pessoa pode ver: as oficiais, as públicas e as dela.
    static getClasses(usuarioId, callback){
        const connection = ClassesBD.connect()

        var sql = `
            select c.*, u.nomeUsuario as autor
            from classes c
            left join usuarios u on u.id = c.usuarioId
            where c.usuarioId is null or c.publico = 1 or c.usuarioId = ?
            order by c.id`

        connection.query(sql, [usuarioId], (error, results)=>{
            if(error){ console.log(error.message); return callback({'error': 'Erro no servidor. Tente de novo.'}) }

            callback(results)
        })

        connection.end()
    }

    // classe: { nome, descricao, imagem, publico, usuarioId }
    static addClasse(classe, callback){

        if(!classe.nome){
            return callback({'error': 'Digite o nome da classe'})
        }

        var nova = {
            usuarioId: classe.usuarioId,
            nome: classe.nome,
            descricao: classe.descricao,
            imagem: classe.imagem,
            publico: classe.publico ? 1 : 0
        }

        const connection = ClassesBD.connect()

        connection.query('insert into classes set ?', nova, (error, results)=>{
            if(error){ console.log(error.message); return callback({'error': 'Erro no servidor. Tente de novo.'}) }

            callback({'message': 'Classe criada com sucesso!'})
        })

        connection.end()
    }

    // Editar: só a descrição e se é pública. classe: { id, descricao, publico }
    static atualizar(classe, usuarioId, callback){
        const connection = ClassesBD.connect()

        var sql = 'update classes set descricao = ?, publico = ? where id = ? and usuarioId = ?'

        connection.query(sql, [classe.descricao, classe.publico ? 1 : 0, classe.id, usuarioId], (error, results)=>{
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

        // uma classe que já está em alguma ficha não pode ser apagada
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

    // ---------- ADMIN: CLASSES OFICIAIS ----------
    // Classe oficial = usuarioId vazio (NULL). Só o admin cria, edita e apaga.
    // classe: { nome, descricao, imagem }
    static addOficial(classe, callback){

        if(!classe.nome){
            return callback({'error': 'Digite o nome da classe'})
        }

        var nova = {
            usuarioId: null,
            nome: classe.nome,
            descricao: classe.descricao,
            imagem: classe.imagem,
            publico: 1
        }

        const connection = ClassesBD.connect()

        connection.query('insert into classes set ?', nova, (error, results)=>{
            if(error){ console.log(error.message); return callback({'error': 'Erro no servidor. Tente de novo.'}) }

            callback({'message': 'Classe oficial criada!'})
        })

        connection.end()
    }

    // classe: { id, nome, descricao, imagem }
    // Se a imagem vier vazia, a imagem que já estava no banco continua.
    static atualizarOficial(classe, callback){

        if(!classe.nome){
            return callback({'error': 'Digite o nome da classe'})
        }

        var sql = 'update classes set nome = ?, descricao = ? where id = ? and usuarioId is null'
        var valores = [classe.nome, classe.descricao, classe.id]

        if(classe.imagem){
            sql = 'update classes set nome = ?, descricao = ?, imagem = ? where id = ? and usuarioId is null'
            valores = [classe.nome, classe.descricao, classe.imagem, classe.id]
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

        // uma classe que já está em alguma ficha não pode ser apagada
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
