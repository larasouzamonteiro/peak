// AvisosBD.js
// Tabela "avisos": os recados da equipe da Peak que aparecem no topo do Início.
// Só o admin cria e apaga (quem confere isso é o exigirAdmin do app.js).
//
//   getAvisos  -> os 3 avisos mais novos (para o Início)
//   addAviso   -> cria um aviso novo
//   excluir    -> apaga um aviso

const conexao = require('./conexao')

class AvisosBD{

    static connect(){
        // versão servidor: usa o pool (veja database/conexao.js)
        return conexao
    }

    // order by id desc: o mais novo primeiro. limit 3: só os 3 últimos.
    static getAvisos(callback){
        const connection = AvisosBD.connect()

        var sql = 'select * from avisos order by id desc limit 3'

        connection.query(sql, (error, results)=>{
            if(error){ console.log(error.message); return callback({'error': 'Erro no servidor. Tente de novo.'}) }

            callback(results)
        })
    }

    // aviso: { titulo, texto }
    static addAviso(aviso, callback){

        var titulo = ''

        if(aviso.titulo){
            titulo = String(aviso.titulo).trim()     // trim tira os espaços do começo e do fim
        }

        var texto = ''

        if(aviso.texto){
            texto = String(aviso.texto).trim()     // trim tira os espaços do começo e do fim
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
