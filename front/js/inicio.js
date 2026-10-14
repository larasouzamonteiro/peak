// inicio.js  (página inicio.html)
// A primeira tela depois do login: a campanha principal da Peak,
// as minhas campanhas e os meus personagens.

if(verificarLogin()){
    carregarMural()
    carregarFichas()

    // primeira vez por aqui (ou pediu para ver de novo em inicio.html?tutorial=sim): a Zero aparece
    if(pegarUsuarioLogado().tutorialVisto == 0 || parametro('tutorial') == 'sim'){
        abrirTutorial()     // função do js/tutorial.js (por isso ele é carregado ANTES deste arquivo no inicio.html)
    }
}

// O mural precisa de duas listas: as campanhas oficiais e as minhas.
// Busca uma, depois a outra, e só então desenha.
function carregarMural(){
    buscar('/campanhas/oficiais', function(oficiais){
        buscar('/campanhas', function(minhas){
            desenharMural(oficiais, minhas)
        })
    })
}

// Desenha em <section id="mural">:
//   1 card grande  -> a primeira campanha oficial, com o botão "Usar como minha campanha"
//   2 cards menores -> as minhas campanhas (se faltar, entram outras oficiais)
function desenharMural(oficiais, minhas){
    var eu = pegarUsuarioLogado()
    var html = ''

    if(oficiais.length > 0){
        var o = oficiais[0]

        html += `
            <article class="foto-card">
                ${htmlFoto(o.imagemCapa, o.nome)}
                <div class="etiquetas"><span class="selo">Oficial</span></div>
                <div class="nome">
                    <b>${seguro(o.nome)}</b>
                    <small>campanha principal da Peak</small>
                    <p>${seguro(o.descricao)}</p>
                    <button type="button" class="botao botao-claro" onclick="usarOficial(${o.id})">▶ Usar como minha campanha</button>
                </div>
            </article>`
    }

    var pequenos = 0

    for(var i = 0; i < minhas.length && pequenos < 2; i++){
        var c = minhas[i]
        var souMestre = (c.usuarioMestreId == eu.id)

        html += `
            <a class="foto-card" href="campanha.html?id=${c.id}">
                ${htmlFoto(c.imagemCapa, c.nome)}
                <div class="etiquetas"><span class="selo ${souMestre ? 'selo-escuro' : ''}">${souMestre ? 'Mestre' : 'Jogando'}</span></div>
                <div class="nome"><b>${seguro(c.nome)}</b><small>${souMestre ? 'você é o mestre' : 'mestre: ' + seguro(c.mestre)}</small></div>
            </a>`

        pequenos = pequenos + 1
    }

    for(var j = 1; j < oficiais.length && pequenos < 2; j++){
        html += `
            <a class="foto-card" href="campanhas.html">
                ${htmlFoto(oficiais[j].imagemCapa, oficiais[j].nome)}
                <div class="etiquetas"><span class="selo">Oficial</span></div>
                <div class="nome"><b>${seguro(oficiais[j].nome)}</b><small>aventura pronta da Peak</small></div>
            </a>`

        pequenos = pequenos + 1
    }

    document.getElementById('mural').innerHTML = html
}

// Botão do card grande: o servidor cria uma cópia da campanha oficial com a pessoa de Mestre
function usarOficial(id){
    enviar('/campanhas/usar-oficial', {id: id}, function(dados){

        if(dados.hasOwnProperty('error')){
            alert(dados.error)
            return
        }

        alert(dados.message)
        window.location.href = 'campanha.html?id=' + dados.id
    })
}

// Abre UMA carta e fecha as outras: só troca a classe "aberta" de lugar.
// A carta continua aberta (parada) até o mouse passar por outra.
// carta: o <article class="carta"> que vai abrir
function abrirCarta(carta){
    var cartas = document.querySelectorAll('#filaCartas .carta')

    for(var i = 0; i < cartas.length; i++){
        cartas[i].classList.remove('aberta')
    }

    carta.classList.add('aberta')
}

// As 3 primeiras fichas viram cartas em <section id="filaCartas">,
// e no final vem o quadro "Criar ficha"
function carregarFichas(){
    buscar('/fichas', function(fichas){
        var html = ''

        for(var i = 0; i < fichas.length && i < 3; i++){
            html += htmlCarta(fichas[i], '')
        }

        html += `
            <a class="card-novo" href="criar-ficha.html">
                <img src="../img/icones/mais.svg" alt="">
                Criar ficha
            </a>`

        document.getElementById('filaCartas').innerHTML = html

        // A carta "aberta" é a que mostra nome, atributos e vida (o visual está no css/inicio.css).
        // A primeira já começa aberta; passar o mouse em outra abre ela.
        var cartas = document.querySelectorAll('#filaCartas .carta')

        if(cartas.length > 0){
            abrirCarta(cartas[0])
        }

        for(var j = 0; j < cartas.length; j++){
            // onmouseenter = quando o mouse entra em cima da carta ("this" é a própria carta)
            cartas[j].onmouseenter = function(){
                abrirCarta(this)
            }
        }
    })
}
