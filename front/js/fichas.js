// fichas.js  (página fichas.html)
// Lista as fichas de quem está logado.

if(verificarLogin()){
    carregarFichas()
}

// Busca as fichas no servidor e desenha uma carta para cada uma.
// Onde aparece no HTML:
//   <div id="listaFichas">      -> as cartas + o quadro "Criar ficha" no final
function carregarFichas(){
    buscar('/fichas', function(fichas){
        var html = ''

        for(var i = 0; i < fichas.length; i++){
            var f = fichas[i]

            // os dois botões que aparecem no canto da carta quando o mouse passa por cima
            var botoes = `
                <a class="botao-icone na-foto editar" title="Editar" aria-label="Editar" href="ficha.html?id=${f.id}&editar=sim"></a>
                <button type="button" class="botao-icone na-foto excluir" title="Excluir" aria-label="Excluir" onclick="excluirFicha(${f.id})"></button>`

            html += htmlCarta(f, botoes)
        }

        // a carta "Nova ficha" fica sempre por último
        // VISUAL: a foto clarinha atrás (img/criar/nova-ficha.jpg) e o "+" rosa
        html += `
            <a class="card-novo" href="criar-ficha.html">
                <img class="card-novo-foto" src="../img/criar/nova-ficha.jpg" alt="">
                <span class="card-novo-mais">+</span>
                <b>Nova ficha</b>
                <small>criar na Oficina</small>
            </a>`

        document.getElementById('listaFichas').innerHTML = html
    })
}

function excluirFicha(id){
    // no banco a ficha sai junto das campanhas (ON DELETE CASCADE), então avisa antes
    if(!confirm('Excluir esta ficha? Se ela estiver em alguma campanha, ela sai da campanha também.')){
        return
    }

    enviar('/fichas/excluir', {id: id}, function(dados){

        if(dados.hasOwnProperty('error')){
            alert(dados.error)
            return
        }

        carregarFichas()
    })
}
