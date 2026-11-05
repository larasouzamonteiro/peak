// RecadoBD.js 
// Os recados do mural da Comunidade (cada mural estilo pinterest).
// tabelas usadas: recados -» cada recado: quem postou, o testo, o tipo (procuro / ofereço), a foto e data
//                 recados_intereses -» as tegs de cada recado (liga o recado ao interese, igual a usuarios_interesses)

const conexao = require('./conexao')

class RecadosBD{

    static connect(){
        // versão servidor: usa o pool (veja database/conexao.js)
        return conexao
    }

    // os 20 recados mais novos, cada um com:
    // o nome e a foto de quem postou(tabela usuarios)  tags ="D&D, fantasia"
    // as tegs, juntas num texto so: sou = "Mestre, Escritor"

       static getRecados(usuarioId, callback){
        const connection = RecadosBD.connect()

        var sql = `
            select r.id, r.texto, r.tipo, r.foto, r.criadoEm, r.usuarioId,
                   u.nomeUsuario, u.fotoPerfil,
                   (select group_concat(i.nome)
                      from recado_interesses ri
                      join interesses i on i.id = ri.interesseId
                     where ri.recadoId = r.id) as tags,
                   (select group_concat(p.nome)
                      from usuario_parcerias up
                      join parcerias p on p.id = up.parceriaId
                     where up.usuarioId = r.usuarioId and up.tipo = 'sou') as sou,
                   (select count(*)
                      from recado_interessados ii
                     where ii.recadoId = r.id) as interessados,
                   (select count(*)
                      from recado_interessados ii
                     where ii.recadoId = r.id and ii.usuarioId = ?) as euMarquei,
                   (select group_concat(u2.nomeUsuario)
                      from recado_interessados ii
                      join usuarios u2 on u2.id = ii.usuarioId
                     where ii.recadoId = r.id) as nomesInteressados
            from recados r
            join usuarios u on u.id = r.usuarioId
            order by r.id desc
            limit 20`

        connection.query(sql, [usuarioId], (error, results)=>{
            if(error){ console.log(error.message); return callback({'error': 'Erro no servidor. Tente de novo.'}) }

            callback(results)
        })

        connection.end()
    }

     // "Em alta no mural": as 5 tags mais usadas em TODOS os recados (sem limite de tempo)
     static getEmAlta(callbeck){
        const connection = RecadosBD.connect()

        // group by junta as linhas da mesma tag; count(*) conta quantas linhas cada grupo tem
        var sql = `
            select i.nome, count(*) as total
            from recado_interesses ri
            join interesses i on i.id = ri.interesseId
            group by i.id, i.nome
            order by total desc
            limit 5`

        connection.query(sql, (error, results)=>{
            if(error){ console. log(error.message); return callbeck({'error': 'Erro no servidor. Tente de novo.'}) }        

            callbeck(results)
        })

        connection.end()
     }

         // publicar um recado novo
    // recado: { texto, tipo, usuarioId }  (as tags e a foto entram nos próximos passos)
    static publicar(recado, callback){

        var texto = String(recado.texto || '').trim()

        if(texto == ''){ return callback({'error': 'Escreva o seu recado'}) }
        if(texto.length > 280){ return callback({'error': 'O recado pode ter no máximo 280 letras'}) }
        if(recado.tipo != 'procuro' && recado.tipo != 'ofereco'){ return callback({'error': 'Escolha Procuro ou Ofereço'}) }

         // TAGS: chegam num texto com os ids separados por vírgula. Ex.: "2,6"
        var tags = []

        if(recado.tags){
            var partes = String(recado.tags).split(',')

            for(var i = 0; i < partes.length; i++){
                var id = Number(partes[i])

                // só entra se for um número de verdade e se ainda não estiver na lista
                if(id > 0 && tags.indexOf(id) == -1){
                    tags.push(id)
                }
            }
        }

        if(tags.length > 3){ return callback({'error': 'Escolha no máximo 3 tags'}) }
        

         var novo = {
            usuarioId: recado.usuarioId,
            texto: texto,
            tipo: recado.tipo,
            foto: recado.foto || null      // sem foto, fica vazio (null)
        }

        const connection = RecadosBD.connect()

        // 1º: salva o recado
        connection.query('insert into recados set ?', novo, (error, results)=>{
            if(error){ console.log(error.message); return callback({'error': 'Erro no servidor. Tente de novo.'}) }

            // o id que o banco deu para o recado novo
            var recadoId = results.insertId

            // sem tags, já terminou
            if(tags.length == 0){
                return callback({'message': 'Recado publicado!'})
            }

            // 2º: uma linha para cada tag -> [ [15, 2], [15, 6] ]
            var linhas = []

            for(var i = 0; i < tags.length; i++){
                linhas.push([recadoId, tags[i]])
            }

            connection.query('insert into recado_interesses (recadoId, interesseId) values ?', [linhas], (error, results)=>{
                if(error){ console.log(error.message); return callback({'error': 'Erro no servidor. Tente de novo.'}) }

                callback({'message': 'Recado publicado!'})
            })
        })
    }
        // apagar um recado: o dono apaga o dele; o admin apaga qualquer um
    // usuario: { id, tipo } -> quem está pedindo (o app.js descobre pelo token)
    static apagar(id, usuario, callback){
        const connection = RecadosBD.connect()

        // 1º: de quem é esse recado?
        connection.query('select usuarioId from recados where id = ?', [id], (error, results)=>{
            if(error){ console.log(error.message); return callback({'error': 'Erro no servidor. Tente de novo.'}) }

            if(results.length == 0){
                return callback({'error': 'Recado não encontrado'})
            }

            // 2º: não é o dono E não é admin -> não pode
            if(results[0].usuarioId != usuario.id && usuario.tipo != 'admin'){
                return callback({'error': 'Você só pode apagar os seus recados'})
            }

            // 3º: apaga as tags e depois o recado
            connection.query('delete from recado_interesses where recadoId = ?', [id], (error, results)=>{
                if(error){ console.log(error.message); return callback({'error': 'Erro no servidor. Tente de novo.'}) }

                connection.query('delete from recados where id = ?', [id], (error, results)=>{
                    if(error){ console.log(error.message); return callback({'error': 'Erro no servidor. Tente de novo.'}) }

                    callback({'message': 'Recado apagado!'})
                })
            })
        })
    }
        // "Tenho interesse": se a pessoa ainda não marcou, marca; se já marcou, desmarca
    static marcarInteresse(recadoId, usuarioId, callback){
        const connection = RecadosBD.connect()

        // 1º: essa pessoa já marcou esse recado?
        connection.query('select recadoId from recado_interessados where recadoId = ? and usuarioId = ?', [recadoId, usuarioId], (error, results)=>{
            if(error){ console.log(error.message); return callback({'error': 'Erro no servidor. Tente de novo.'}) }

            if(results.length > 0){
                // já tinha marcado -> desmarca (apaga a linha)
                connection.query('delete from recado_interessados where recadoId = ? and usuarioId = ?', [recadoId, usuarioId], (error, results)=>{
                    if(error){ console.log(error.message); return callback({'error': 'Erro no servidor. Tente de novo.'}) }

                    callback({'message': 'Interesse tirado', 'marcado': false})
                })
            }else{
                // ainda não tinha -> marca (cria a linha)
                connection.query('insert into recado_interessados set ?', {recadoId: recadoId, usuarioId: usuarioId}, (error, results)=>{
                    if(error){ console.log(error.message); return callback({'error': 'Erro no servidor. Tente de novo.'}) }

                                       callback({'message': 'Interesse marcado!', 'marcado': true})
                })
            }
        })
    }                   // fecha o MARCARINTERESSE
}                       // fecha a classe
module.exports = RecadosBD