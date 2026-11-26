const conexao = require('./conexao')

class AvisosBD{

    static connect(){
        return conexao
    }

    static getAvisos(callback){
        const connection = AvisosBD.connect()

        var sql = 'select * from avisos order by id desc limit 3'

        connection.query(sql, (error, results)=>{
            if(error){ console.log(error.message); return callback({'error': 'Erro no servidor. Tente de novo.'}) }

            callback(results)
        })
    }

    static addAviso(aviso, callback){

        var titulo = ''

        if(aviso.titulo){
            titulo = String(aviso.titulo).trim()
        }

        var texto = ''

        if(aviso.texto){
            texto = String(aviso.texto).trim()
        }

        if(titulo == ''){
            return callback({'error': 'Digite o título do aviso'})
        }

        if(titulo.length > 80){
            return callback({'error': 'O título pode ter no máximo 80 letras'})
        }

        if(texto.length > 200){
            return callback({'error': 'O texto pode ter no máximo 200 letras'})
        }

        var novo = {
            titulo: titulo,
            texto: texto
        }

        const connection = AvisosBD.connect()

        connection.query('insert into avisos set ?', novo, (error, results)=>{
            if(error){ console.log(error.message); return callback({'error': 'Erro no servidor. Tente de novo.'}) }

            callback({'message': 'Aviso publicado!'})
        })
    }

    static excluir(id, callback){
        const connection = AvisosBD.connect()

        connection.query('delete from avisos where id = ?', [id], (error, results)=>{
            if(error){ console.log(error.message); return callback({'error': 'Erro no servidor. Tente de novo.'}) }

            if(results.affectedRows == 0){
                callback({'error': 'Aviso não encontrado'})
            }else{
                callback({'message': 'Aviso apagado!'})
            }
        })
    }
}

module.exports = AvisosBD
