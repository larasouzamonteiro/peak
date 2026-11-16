// evento.js  (usado no inicio.html, carregado ANTES do inicio.js)
// O EVENTO DE TEMA (ex.: Natal) no Início:
//   1. carregarEvento pergunta ao servidor se tem evento agora (/eventos/ativo)
//   2. quem ainda não viu: aparece o presente (3 toques abrem as 3 cartas)
//   3. "Coletar tudo" avisa o servidor que a pessoa viu (/eventos/visto)
//   4. quem já viu: fica a decoração e a caixinha em cima do dado (reabrirPresente)
// As animações (tremer, confete, virar as cartas) estão no inicio.css: o JS só troca classes.

var eventoAtual = null      // o evento que veio do servidor
var toques = 0              // quantas vezes tocou no presente
var cartaAtual = 0          // qual carta está aparecendo (1, 2 ou 3)

// O SOM DO PRESENTE (baixinho): o "pling" de cada toque.
// "Audio" é o tocador de som do navegador (o mesmo do mapa). O volume vai de 0 a 1.
// A música de Natal fica no visual.js (musicaNatal), porque ela toca em todas as páginas.
var somToque = new Audio('../sons/presente-toque.mp3')
somToque.volume = 0.4

function carregarEvento(){
    buscar('/eventos/ativo', function(evento){
        var corpo = document.body

        // a tela do presente já está aberta: não mexe em nada
        if(!document.getElementById('eventoTela').classList.contains('oculto')){
            return
        }

        // começa limpando (se o evento acabou, a decoração some sozinha)
        corpo.classList.remove('tema-natal', 'decorado')
        document.getElementById('presenteCanto').classList.add('oculto')

        // sem evento agora (o servidor mandou {} ou um erro)
        if(!evento.id){
            eventoAtual = null
            escolherBanners(false)
            return
        }

        // no Natal, os banners do Natal, no mesmo lugar
        escolherBanners(evento.tema == 'natal')

        eventoAtual = evento
        corpo.classList.add('tema-' + evento.tema)

        if(evento.jaVi > 0){
            corpo.classList.add('decorado')      // já coletou: a decoração e a caixinha em cima do dado
            document.getElementById('presenteCanto').classList.remove('oculto')
        }else{
            abrirTelaDoEvento()                  // ainda não viu: o presente aparece
        }
    })
}

// Mostra a tela do presente. Se o tutorial da Zero estiver aberto, espera ele acabar.
function abrirTelaDoEvento(){
    if(!document.getElementById('tutorial').classList.contains('oculto')){
        setTimeout(abrirTelaDoEvento, 2000)
        return
    }

    toques = 0
    cartaAtual = 0
    montarCartas()
    document.querySelector('.ev-coletar').textContent = 'Coletar tudo'

    var tela = document.getElementById('eventoTela')
    tela.classList.remove('aberto', 'carta-1', 'carta-2', 'carta-3', 'tudo')
    tela.classList.remove('oculto')

    // voltou da campanha (inicio.html?presente=1): abre direto nas 3 cartas, sem os toques
    if(parametro('presente') == '1'){
        toques = 3
        cartaAtual = 4
        tela.classList.add('aberto', 'tudo')
    }

    // a decoração do tema já aparece em volta do presente (igual ao vídeo)
    document.body.classList.add('decorado')
}

// Cada toque no presente: ele treme e acende uma bolinha. No 3º, abre.
function tocarPresente(){
    var presente = document.getElementById('evPresente')
    var bolinhas = document.querySelectorAll('#evPontos i')

    // já abriu: os toques a mais não fazem nada
    if(toques >= 3){
        return
    }

    toques++
    bolinhas[toques - 1].classList.add('aceso')

    // o guizo: volta para o começo e toca (assim toca certinho mesmo clicando rápido)
    somToque.currentTime = 0
    somToque.play()

    // "tremendo" fica meio segundo (o tempo da animação no CSS)
    presente.classList.add('tremendo')
    setTimeout(function(){
        presente.classList.remove('tremendo')
    }, 500)

    if(toques == 3){
        // espera o último tremido e abre: confetes + as 3 cartas viradas
        setTimeout(function(){
            var tela = document.getElementById('eventoTela')
            tela.classList.add('aberto')

            // abriu: começa a música de Natal
            tocarMusicaNatal()

            // um pouquinho depois, a 1ª carta vira sozinha
            setTimeout(proximaCarta, 1400)
        }, 500)
    }
}

// "Próxima ›": passa para a próxima carta. Depois da 3ª, mostra as 3 juntas.
function proximaCarta(){
    var tela = document.getElementById('eventoTela')
    var botao = document.getElementById('evProxima')

    tela.classList.remove('carta-1', 'carta-2', 'carta-3')
    cartaAtual++

    if(cartaAtual > 3){
        tela.classList.add('tudo')
        return
    }

    tela.classList.add('carta-' + cartaAtual)
    document.getElementById('evContador').textContent = cartaAtual + ' / 3'

    if(cartaAtual == 3){
        botao.textContent = 'Ver tudo ›'
    }else{
        botao.textContent = 'Próxima ›'
    }
}

// Escreve a frente das 3 cartas com o que veio do servidor
//   1. o título e a novidade (o admin escreve na aba Eventos)
//   2. a campanha de Natal (a oficial marcada "Somente em eventos")
//   3. o desafio do bem com o QR code (já vem com o site)
function montarCartas(){
    var e = eventoAtual
    var tema = nomeDoTema(e.tema)     // 'natal' vira 'Natal' (função do script.js)

    // o verso de cada carta: "NATAL · 1/3"
    for(var i = 1; i <= 3; i++){
        document.getElementById('evVerso' + i).textContent = tema.toUpperCase() + ' · ' + i + '/3'
    }

    // CARTA 1: o título e a novidade que o admin escreveu, com as datas do evento
    var novidade = textoOuPadrao(e.novidade, 'Tem novidade de ' + tema + ' esperando por você na Peak!')

    var carta1 = `<img class="foto" src="../img/eventos/natal-novidades.jpg" alt="">
        <b>${seguro(e.titulo)}</b>
        <span class="ev-tipo">${textoDasDatas(e.inicio, e.fim)}</span>
        <p>${seguro(novidade)}</p>`

    // CARTA 2: a campanha de Natal (abre direto na página de Campanhas)
    var carta2 = ''

    if(e.campanha){
        carta2 += htmlFoto(e.campanha.imagemCapa, 'campanha') + `
            <b>${seguro(e.campanha.nome)}</b>
            <span class="ev-tipo">Só no ${tema}</span>
            <p>${seguro(e.campanha.descricao)}</p>
            <a class="ev-link" href="campanhas.html?oficial=${e.campanha.id}&voltar=presente">Ver campanha ›</a>`
    }else{
        carta2 += '<b>Em breve</b><p>A campanha deste evento ainda está sendo escrita.</p>'
    }

    // CARTA 3: o desafio do bem do Natal, com o QR code que leva para o Instagram.
    // Ele já vem com o site: o texto está aqui e a imagem em img/eventos/qr-desafio-natal.png.
    var carta3 = `<span class="ev-tag">DESAFIO DO NATAL</span>
        <b>Dê um abraço</b>
        <p>Abrace alguém que você ama, registre esse momento e compartilhe com a gente no grupo do Instagram da Peak!</p>
        <img class="ev-qr" src="../img/eventos/qr-desafio-natal.png" alt="QR code do desafio">
        <small class="ev-camera">Aponte a câmera do celular</small>`

    document.getElementById('evCarta1').innerHTML = carta1
    document.getElementById('evCarta2').innerHTML = carta2
    document.getElementById('evCarta3').innerHTML = carta3
    document.getElementById('evCarta3').classList.add('ev-desafio')

    // as bolinhas começam apagadas
    var bolinhas = document.querySelectorAll('#evPontos i')
    for(var j = 0; j < bolinhas.length; j++){
        bolinhas[j].classList.remove('aceso')
    }
}

// As datas do evento em texto: "1 a 25 de dezembro" (ou "20 de dezembro a 6 de janeiro").
// getUTC...: o banco guarda a hora de Brasília "sem fuso"; lendo em UTC o dia não muda.
function textoDasDatas(inicio, fim){
    var meses = ['janeiro', 'fevereiro', 'março', 'abril', 'maio', 'junho', 'julho',
                 'agosto', 'setembro', 'outubro', 'novembro', 'dezembro']
    var a = new Date(inicio)
    var b = new Date(fim)

    if(a.getUTCMonth() == b.getUTCMonth()){
        return a.getUTCDate() + ' a ' + b.getUTCDate() + ' de ' + meses[b.getUTCMonth()]
    }

    return a.getUTCDate() + ' de ' + meses[a.getUTCMonth()] + ' a ' + b.getUTCDate() + ' de ' + meses[b.getUTCMonth()]
}

// "Coletar tudo": o servidor guarda que eu vi, a tela fecha e vem a decoração
function coletarPresente(){
    enviar('/eventos/visto', {eventoId: eventoAtual.id}, function(dados){

        if(dados.hasOwnProperty('error')){
            avisar('Não deu certo', dados.error, 'erro')
            return
        }

        document.getElementById('eventoTela').classList.add('oculto')
        document.body.classList.add('decorado')
        document.getElementById('presenteCanto').classList.remove('oculto')
    })
}

// A caixinha em cima do dado: abre as 3 cartas de novo, direto (sem os 3 toques).
// O presente já foi coletado, então o botão de baixo vira "Fechar".
function reabrirPresente(){
    toques = 3
    cartaAtual = 4
    montarCartas()

    var tela = document.getElementById('eventoTela')
    tela.classList.remove('carta-1', 'carta-2', 'carta-3')
    tela.classList.add('aberto', 'tudo')
    tela.classList.remove('oculto')

    document.querySelector('.ev-coletar').textContent = 'Fechar'

    // começa a música, a não ser que a pessoa tenha pausado no botão do som
    if(localStorage.getItem('musicaNatal') != 'pausada'){
        tocarMusicaNatal()
    }
}
