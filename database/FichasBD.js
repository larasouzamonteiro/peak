// FichasBD.js
// Tabelas "fichas" (personagens), "itens" e "ficha_itens" (os itens que cada ficha carrega).

const conexao = require('./conexao')

var LIMITE_ITENS = 3

// Confere os números da ficha. Devolve o texto do erro, ou '' se estiver tudo certo.
function conferirNumeros(ficha){
    var atributos = ['forca', 'destreza', 'constituicao', 'inteligencia', 'sabedoria', 'carisma']

    for(var i = 0; i < atributos.length; i++){
        var valor = Number(ficha[atributos[i]])

        if(!(valor >= 1 && valor <= 30)){
            return 'Os atributos precisam ser números de 1 a 30'
        }
    }

    if(!(Number(ficha.nivel) >= 1 && Number(ficha.nivel) <= 100)){
        return 'O nível precisa ser de 1 a 100'
    }

    if(!(Number(ficha.vidaMaxima) >= 1 && Number(ficha.vidaMaxima) <= 9999)){
        return 'A vida máxima precisa ser de 1 a 9999'
    }

    if(!(Number(ficha.vidaAtual) >= 0) || Number(ficha.vidaAtual) > Number(ficha.vidaMaxima)){
        return 'A vida atual precisa ficar entre 0 e a vida máxima'
    }

    return ''
}

class FichasBD{

    static connect(){
        // versão servidor: usa o pool (veja database/conexao.js)
        return conexao
    }

    // As fichas de UMA pessoa.
    // Os JOINs trazem o nome da raça e da classe (na ficha só ficam os ids delas).
    static getFichas(usuarioId, callback){
        const connection = FichasBD.connect()

        var sql = `
            select f.*, r.nome as raca, c.nome as classe
            from fichas f
            join racas r on r.id = f.racaId
            join classes c on c.id = f.classeId
            where f.usuarioId = ?
            order by f.id`

        connection.query(sql, [usuarioId], (error, results)=>{
            if(error){ console.log(error.message); return callback({'error': 'Erro no servidor. Tente de novo.'}) }

            callback(results)
        })

        connection.end()
    }

    // UMA ficha completa (para a janela da ficha aberta)
    static getFicha(id, callback){
        const connection = FichasBD.connect()

        var sql = `
            select f.*, r.nome as raca, r.descricao as racaDescricao,
                   c.nome as classe, c.descricao as classeDescricao,
                   u.nomeUsuario as dono
            from fichas f
            join racas r on r.id = f.racaId
            join classes c on c.id = f.classeId
            join usuarios u on u.id = f.usuarioId
            where f.id = ?`

        connection.query(sql, [id], (error, results)=>{
            if(error){ console.log(error.message); return callback({'error': 'Erro no servidor. Tente de novo.'}) }

            if(results.length == 0){
                callback({'error': 'Ficha não encontrada'})
            }else{
                callback(results[0])
            }
        })

        connection.end()
    }

    // Todos os itens que existem (para escolher na oficina)
    static getItens(callback){
        const connection = FichasBD.connect()

        connection.query('select * from itens order by id', (error, results)=>{
            if(error){ console.log(error.message); return callback({'error': 'Erro no servidor. Tente de novo.'}) }

            callback(results)
        })

        connection.end()
    }

    // Os itens que UMA ficha carrega
    static getItensDaFicha(fichaId, callback){
        const connection = FichasBD.connect()

        var sql = `
            select i.id, i.nome, i.tipo, i.imagem
            from ficha_itens fi
            join itens i on i.id = fi.itemId
            where fi.fichaId = ?
            order by i.id`

        connection.query(sql, [fichaId], (error, results)=>{
            if(error){ console.log(error.message); return callback({'error': 'Erro no servidor. Tente de novo.'}) }

            callback(results)
        })

        connection.end()
    }

    // ficha: tudo o que a oficina manda (js/criar-ficha.js) + itemIds: [5, 9, 10]
    static addFicha(ficha, callback){

        if(!ficha.nome || !ficha.racaId || !ficha.classeId){
            return callback({'error': 'Escolha o nome, a raça e a classe do personagem'})
        }

        var erro = conferirNumeros(ficha)

        if(erro != ''){
            return callback({'error': erro})
        }

        var itemIds = ficha.itemIds || []

        // versão servidor: itemIds tem que ser uma lista de números inteiros
        if(!Array.isArray(itemIds)){
            return callback({'error': 'Itens inválidos'})
        }

        for(var i = 0; i < itemIds.length; i++){
            if(!Number.isInteger(Number(itemIds[i]))){
                return callback({'error': 'Itens inválidos'})
            }
        }

        // tira os ids repetidos ([1, 1] vira [1]): o mesmo item não entra duas vezes
        var semRepetir = []

        for(var i = 0; i < itemIds.length; i++){
            var itemId = Number(itemIds[i])

            if(semRepetir.indexOf(itemId) == -1){
                semRepetir.push(itemId)
            }
        }

        itemIds = semRepetir

        if(itemIds.length > LIMITE_ITENS){
            return callback({'error': 'Escolha no máximo ' + LIMITE_ITENS + ' itens'})
        }

        // monta a ficha campo por campo: o que a página mandar a mais é ignorado
        var nova = {
            usuarioId: ficha.usuarioId,
            nome: ficha.nome,
            retrato: ficha.retrato,
            racaId: ficha.racaId,
            classeId: ficha.classeId,
            nivel: ficha.nivel,
            vidaMaxima: ficha.vidaMaxima,
            vidaAtual: ficha.vidaAtual,
            forca: ficha.forca,
            destreza: ficha.destreza,
            constituicao: ficha.constituicao,
            inteligencia: ficha.inteligencia,
            sabedoria: ficha.sabedoria,
            carisma: ficha.carisma,
            alinhamento: ficha.alinhamento,
            personalidade: ficha.personalidade,
            historia: ficha.historia
        }

        const connection = FichasBD.connect()

        // versão servidor: a raça e a classe têm que ser oficiais, públicas ou da própria pessoa
        var sql = `select
            (select count(*) from racas where id = ? and (usuarioId is null or publico = 1 or usuarioId = ?)) as raca,
            (select count(*) from classes where id = ? and (usuarioId is null or publico = 1 or usuarioId = ?)) as classe`

        connection.query(sql, [nova.racaId, nova.usuarioId, nova.classeId, nova.usuarioId], (error, results)=>{
            if(error){ console.log(error.message); return callback({'error': 'Erro no servidor. Tente de novo.'}) }

            if(results[0].raca == 0 || results[0].classe == 0){
                return callback({'error': 'Raça ou classe não encontrada'})
            }

            if(itemIds.length == 0){
                return FichasBD.inserirFicha(nova, itemIds, callback)
            }

            // confere ANTES de gravar se todos os itens existem.
            // Se algum não existir, nada é gravado (senão ficava uma ficha sem os itens).
            // um "?" para cada item: "id in (?, ?, ?)"
            var marcadores = []

            for(var i = 0; i < itemIds.length; i++){
                marcadores.push('?')
            }

            var sqlItens = 'select count(*) as total from itens where id in (' + marcadores.join(', ') + ')'

            connection.query(sqlItens, itemIds, function(error, results){
                if(error){ console.log(error.message); return callback({'error': 'Erro no servidor. Tente de novo.'}) }

                if(results[0].total != itemIds.length){
                    return callback({'error': 'Item não encontrado'})
                }

                FichasBD.inserirFicha(nova, itemIds, callback)
            })
        })
    }

    // (versão servidor) a parte que grava a ficha e os itens, depois da conferência acima
    static inserirFicha(nova, itemIds, callback){
        const connection = FichasBD.connect()

        connection.query('insert into fichas set ?', nova, (error, results)=>{
            if(error){ console.log(error.message); return callback({'error': 'Erro no servidor. Tente de novo.'}) }

            // insertId = o id que o banco deu para a ficha que acabou de ser criada
            var fichaId = results.insertId

            if(itemIds.length == 0){
                connection.end()
                return callback({'message': 'Ficha criada com sucesso!', id: fichaId})
            }

            // uma linha em ficha_itens para cada item escolhido: [[fichaId, 5], [fichaId, 9]]
            // com "values ?" o MySQL insere todas as linhas de uma vez
            var linhas = []

            for(var i = 0; i < itemIds.length; i++){
                linhas.push([fichaId, itemIds[i]])
            }

            connection.query('insert into ficha_itens (fichaId, itemId) values ?', [linhas], (error, results)=>{
                if(error){ console.log(error.message); return callback({'error': 'Erro no servidor. Tente de novo.'}) }

                connection.end()
                callback({'message': 'Ficha criada com sucesso!', id: fichaId})
            })
        })
    }

    // Editar: só o que muda durante o jogo.
    // ficha: { id, nivel, vidaMaxima, vidaAtual, os 6 atributos, personalidade, historia }
    static atualizar(ficha, usuarioId, callback){
        var erro = conferirNumeros(ficha)

        if(erro != ''){
            return callback({'error': erro})
        }

        const connection = FichasBD.connect()

        // "and usuarioId = ?" garante que a pessoa só edita a ficha DELA
        var sql = `
            update fichas
            set nivel = ?, vidaMaxima = ?, vidaAtual = ?,
                forca = ?, destreza = ?, constituicao = ?, inteligencia = ?, sabedoria = ?, carisma = ?,
                personalidade = ?, historia = ?
            where id = ? and usuarioId = ?`

        var valores = [ficha.nivel, ficha.vidaMaxima, ficha.vidaAtual,
                       ficha.forca, ficha.destreza, ficha.constituicao, ficha.inteligencia, ficha.sabedoria, ficha.carisma,
                       ficha.personalidade, ficha.historia,
                       ficha.id, usuarioId]

        connection.query(sql, valores, (error, results)=>{
            if(error){ console.log(error.message); return callback({'error': 'Erro no servidor. Tente de novo.'}) }

            if(results.affectedRows == 0){
                callback({'error': 'Ficha não encontrada'})
            }else{
                callback({'message': 'Ficha salva!'})
            }
        })

        connection.end()
    }

    static excluir(id, usuarioId, callback){
        const connection = FichasBD.connect()

        connection.query('delete from fichas where id = ? and usuarioId = ?', [id, usuarioId], (error, results)=>{
            if(error){ console.log(error.message); return callback({'error': 'Erro no servidor. Tente de novo.'}) }

            if(results.affectedRows == 0){
                callback({'error': 'Ficha não encontrada'})
            }else{
                callback({'message': 'Ficha excluída!'})
            }
        })

        connection.end()
    }
}

module.exports = FichasBD
