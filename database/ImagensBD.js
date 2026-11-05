// ImagensBD.js  (nov/2026)
// =====================================================
// FOTOS MAIS RÁPIDAS
// =====================================================
// O problema: as fotos que as pessoas enviam (monstros, capas de campanha,
// retratos de ficha, foto e capa do perfil, fotos do mural) ficam salvas no banco como um TEXTO enorme ("data:image...").
// Quando o site pedia a lista de monstros, esses textos iam todos juntos
// e a lista ficava com uns 5 MB (demorava uns 10 segundos para aparecer).
//
// A solução (o banco continua igual):
//   1. trocarFotos: antes de responder uma lista, o servidor troca cada foto
//      grande por um endereço curto, ex.: "/imagem?tipo=monstro&id=7".
//      A lista fica leve e os cards aparecem na hora.
//   2. getImagem: quando o navegador abre esse endereço, a rota /imagem do app.js
//      usa esta função para buscar SÓ aquela foto no banco.
//      Cada foto carrega sozinha, ao mesmo tempo que as outras.

const conexao = require('./conexao')

// qual tabela e qual coluna guardam a foto de cada tipo
const LUGAR_DA_FOTO = {
    'monstro':  {tabela: 'monstros',  coluna: 'imagem'},
    'campanha': {tabela: 'campanhas', coluna: 'imagemCapa'},
    'ficha':    {tabela: 'fichas',    coluna: 'retrato'},
    'perfil':   {tabela: 'usuarios',  coluna: 'fotoPerfil'},     // a foto da pessoa (menu, comunidade, perfil)
    'capa':     {tabela: 'usuarios',  coluna: 'capaPerfil'},     // a capa do perfil
    'recado':   {tabela: 'recados',   coluna: 'foto'}            // a foto de um recado do mural
}

class ImagensBD{

    // lista -> o que veio do banco (ex.: os monstros)
    // campo -> o nome da coluna da foto (ex.: 'imagem')
    // tipo  -> 'monstro', 'campanha', 'ficha', 'perfil', 'capa' ou 'recado'
    // campoId -> opcional: de qual coluna vem o id (normalmente 'id').
    //            Ex.: num recado, a foto da PESSOA usa o 'usuarioId', não o id do recado.
    static trocarFotos(lista, campo, tipo, campoId){

        if(campoId == undefined){
            campoId = 'id'
        }

        // se veio um erro em vez de uma lista, não faz nada
        if(lista.length == undefined){
            return
        }

        for(var i = 0; i < lista.length; i++){
            var foto = lista[i][campo]

            // foto salva como texto é enorme (milhares de letras);
            // foto de arquivo ("img/monstros/mimico.jpg") é curtinha e fica como está
            if(foto != null && foto.length > 1000){
                // o "&v=" muda quando a foto muda, assim o navegador não mostra a foto antiga
                lista[i][campo] = '/imagem?tipo=' + tipo + '&id=' + lista[i][campoId] + '&v=' + foto.length
            }
        }
    }

    // busca a foto de UM monstro, campanha ou ficha
    static getImagem(tipo, id, callback){
        var lugar = LUGAR_DA_FOTO[tipo]

        // tipo que não existe: não procura nada
        if(lugar == undefined){
            return callback(null)
        }

        var sql = 'select ' + lugar.coluna + ' as foto from ' + lugar.tabela + ' where id = ?'

        conexao.query(sql, [id], (error, results)=>{
            if(error){ console.log(error.message); return callback(null) }

            if(results.length == 0){
                return callback(null)
            }

            callback(results[0].foto)
        })
    }
}

module.exports = ImagensBD
