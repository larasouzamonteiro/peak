

const conexao = require('./conexao')


const AGORA = 'date_sub(utc_timestamp(), interval 3 hour)'

class EventosBD{

    static connect(){
       
        return conexao
    }

   
    static getAtivo(usuarioId, callback){
        const connection = EventosBD.connect()

        var sql = `
            select e.*,
                   (select count(*) from eventos_vistos v
                    where v.eventoId = e.id and v.usuarioId = ?) as jaVi
            from eventos e
            where ${AGORA} between e.inicio and e.fim
            order by e.id desc
            limit 1`

        connection.query(sql, [usuarioId], (error, results)=>{
            if(error){ console.log(error.message); return callback({'error': 'Erro no servidor. Tente de novo.'}) }

            if(results.length == 0){
                return callback({})
            }

            var evento = results[0]

            var sql2 = 'select id, nome, descricao, imagemCapa from campanhas where oficial = 1 and tema = ? limit 1'

            connection.query(sql2, [evento.tema], (error, campanhas)=>{
                if(error){ console.log(error.message); return callback({'error': 'Erro no servidor. Tente de novo.'}) }

                // a campanha do evento (se não tiver nenhuma, fica vazio)
                evento.campanha = null

                if(campanhas.length > 0){
                    evento.campanha = campanhas[0]
                }

               
                var sql3 = `
                    select nome, descricao, imagem, 'raca' as tipo from racas where tema = ? and usuarioId is null
                    union all
                    select nome, descricao, imagem, 'classe' as tipo from classes where tema = ? and usuarioId is null
                    union all
                    select nome, descricao, imagem, 'monstro' as tipo from monstros where tema = ? and usuarioId is null
                    limit 1`

                connection.query(sql3, [evento.tema, evento.tema, evento.tema], (error, personagens)=>{
                    if(error){ console.log(error.message); return callback({'error': 'Erro no servidor. Tente de novo.'}) }

                    evento.personagem = null

                    if(personagens.length > 0){
                        evento.personagem = personagens[0]
                    }

                    callback(evento)
                })
            })
        })
    }


    static getEventos(callback){
        const connection = EventosBD.connect()

        var sql = `
            select e.id, e.titulo, e.tema,
                   date_format(e.inicio, '%d/%m/%Y %H:%i') as inicioTexto,
                   date_format(e.fim, '%d/%m/%Y %H:%i') as fimTexto,
                   (select count(*) from eventos_vistos v where v.eventoId = e.id) as vistos
            from eventos e
            order by e.inicio desc`

        connection.query(sql, (error, results)=>{
            if(error){ console.log(error.message); return callback({'error': 'Erro no servidor. Tente de novo.'}) }

            callback(results)
        })
    }

   
    static addEvento(evento, callback){

        var titulo = ''

        if(evento.titulo){
            titulo = String(evento.titulo).trim()     // trim tira os espaços do começo e do fim
        }

        var temas = ['natal',]

        if(titulo == ''){
            return callback({'error': 'Digite o título do evento'})
        }

        if(titulo.length > 80){
            return callback({'error': 'O título pode ter no máximo 80 letras'})
        }

        if(temas.indexOf(evento.tema) == -1){
            return callback({'error': 'Escolha o tema do evento'})
        }

        if(!evento.inicio || !evento.fim){
            return callback({'error': 'Escolha a data de início e de fim'})
        }

        
        if(evento.fim <= evento.inicio){
            return callback({'error': 'O fim precisa ser depois do início'})
        }

        var novo = {
            titulo: titulo,
            novidade: evento.novidade,
            tema: evento.tema,
            inicio: evento.inicio.replace('T', ' '),
            fim: evento.fim.replace('T', ' ')
        }

        const connection = EventosBD.connect()

        connection.query('insert into eventos set ?', novo, (error, results)=>{
            if(error){ console.log(error.message); return callback({'error': 'Erro no servidor. Tente de novo.'}) }

            callback({'message': 'Evento criado!'})
        })
    }

    static excluir(id, callback){
        const connection = EventosBD.connect()

        connection.query('delete from eventos where id = ?', [id], (error, results)=>{
            if(error){ console.log(error.message); return callback({'error': 'Erro no servidor. Tente de novo.'}) }

            if(results.affectedRows == 0){
                callback({'error': 'Evento não encontrado'})
            }else{
                callback({'message': 'Evento apagado!'})
            }
        })
    }

    
    // "Coletar tudo": guarda que a pessoa viu o presente E dá o retrato do tema para ela
    static marcarVisto(usuarioId, eventoId, callback){
        const connection = EventosBD.connect()

        var sql = 'insert ignore into eventos_vistos (usuarioId, eventoId) values (?, ?)'

        connection.query(sql, [usuarioId, eventoId], (error, results)=>{
            if(error){ console.log(error.message); return callback({'error': 'Erro no servidor. Tente de novo.'}) }

            // o retrato de presente: o tema vem do próprio evento (ex.: 'natal')
            var sql2 = `
                insert ignore into retratos_ganhos (usuarioId, tema, ganhoEm)
                select ?, tema, ${AGORA} from eventos where id = ?`

            connection.query(sql2, [usuarioId, eventoId], (error, results)=>{
                if(error){ console.log(error.message); return callback({'error': 'Erro no servidor. Tente de novo.'}) }

                callback({'message': 'Presente coletado!'})
            })
        })
    }
        // Os retratos de presente que a pessoa já ganhou (para a lista de retratos da Oficina).
    // "novo" vale 1 nos primeiros 7 dias depois que ela ganhou, e 0 depois disso.
    static getRetratosGanhos(usuarioId, callback){
        const connection = EventosBD.connect()

        var sql = `
            select tema,
                   (ganhoEm > date_sub(${AGORA}, interval 7 day)) as novo
            from retratos_ganhos
            where usuarioId = ?
            order by ganhoEm desc`

        connection.query(sql, [usuarioId], (error, results)=>{
            if(error){ console.log(error.message); return callback({'error': 'Erro no servidor. Tente de novo.'}) }

            callback(results)
        })
    }

    static mostrarDeNovo(eventoId, callback){
        const connection = EventosBD.connect()

        connection.query('delete from eventos_vistos where eventoId = ?', [eventoId], (error, results)=>{
            if(error){ console.log(error.message); return callback({'error': 'Erro no servidor. Tente de novo.'}) }

            callback({'message': 'Pronto! O presente vai aparecer de novo para todos.'})
        })
    }
}

module.exports = EventosBD