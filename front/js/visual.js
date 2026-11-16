// visual.js
// Só a APARÊNCIA do site (nada aqui é necessário para salvar ou buscar dados):
//   1. modo escuro, menu do celular e o olho da senha
//   2. a abertura (a tela escura com o "peak." e a porcentagem)
//   3. o segredinho (easter egg)
//   4. o site no Natal (pisca-pisca, neve e bonequinhas)
// É carregado DEPOIS do script.js (usa o buscar e o avisar de lá).
//
// Regra do projeto: o JavaScript NÃO escreve CSS. Ele só coloca ou tira classes.

// =====================================================
// 1. MODO ESCURO, MENU DO CELULAR E OLHO DA SENHA
// =====================================================
// O tema fica guardado no localStorage (no navegador), igual o token.
//   'escuro' -> o <html> ganha a classe "escuro" (as cores estão no style.css, parte "MODO ESCURO")
//   qualquer outra coisa (ou nada) -> claro
// O botão para trocar fica em Perfil > Configurações (perfil.html).
// VISUAL: a classe fica no <html> (document.documentElement) e não no <body> porque
// o <script> do <head> de cada página já coloca ela antes da página aparecer.
// Assim a página não pisca branca quando a pessoa usa o modo escuro.

function aplicarTema(){
    var tema = localStorage.getItem('tema')

    if(tema == 'escuro'){
        document.documentElement.classList.add('escuro')
    }else{
        document.documentElement.classList.remove('escuro')
    }
}

// tema: 'claro' ou 'escuro'
function mudarTema(tema){
    localStorage.setItem('tema', tema)
    aplicarTema()
}

// roda em toda página (o visual.js está em todas)
aplicarTema()

// Celular: o botão "Mais" da barra de baixo abre e fecha o menu inteiro
function abrirMais(){
    document.querySelector('.lateral').classList.toggle('mais-aberto')
}

// Botão de olho dos campos de senha: mostra ou esconde o que foi digitado.
// O botão fica dentro de <div class="campo-senha"> junto com o input.
function verSenha(botao){
    var caixa = botao.parentElement
    var input = caixa.querySelector('input')

    if(input.type == 'password'){
        input.type = 'text'
        caixa.classList.add('mostrando')
        botao.setAttribute('aria-label', 'Esconder senha')
    }else{
        input.type = 'password'
        caixa.classList.remove('mostrando')
        botao.setAttribute('aria-label', 'Mostrar senha')
    }
}



// =====================================================
// 2. ABERTURA (a tela escura com o "peak." e a porcentagem)
// =====================================================
// Aparece só UMA vez por visita: na primeira página de dentro do site.
// O sessionStorage é igual ao localStorage, mas se apaga quando a aba fecha.
//
// Como a porcentagem funciona (sem mexer nos pedidos ao servidor):
//   enquanto uma lista carrega, a página mostra o círculo girando (<div class="carregando">).
//   Quando a lista chega, o círculo some. Então a porcentagem é: quantos círculos já sumiram.
//   O número na tela vai subindo de 1 em 1 até ela, e quando chega a 100 a abertura some devagar.
// A linha rosa é um <progress> (a barrinha de progresso do HTML): o JS só muda o value,
// e a aparência dela fica no style.css (regra do projeto: JS não escreve CSS).
var circulosNoComeco = 0      // quantos círculos de "carregando" a página tinha quando abriu
var numeroAbertura = 0
var relogioAbertura = null
var inicioAbertura = 0

function criarAbertura(){
    // só nas páginas de dentro (as que têm o menu lateral) e só uma vez por visita.
    // Se não for para abrir, tira a classe "abrindo" que o <head> colocou (a página aparece normal).
    if(!document.querySelector('.lateral') || sessionStorage.getItem('abriu')){
        document.documentElement.classList.remove('abrindo')
        return
    }

    document.documentElement.classList.add('abrindo')

    sessionStorage.setItem('abriu', 'sim')

    document.body.insertAdjacentHTML('beforeend', `
        <div class="abertura" id="abertura">
            <div class="abertura-logo"><span>peak<i>.</i></span></div>
            <progress class="abertura-linha" id="aberturaBarra" max="100" value="0"></progress>
            <div class="abertura-baixo">
                <small>PREPARANDO A MESA</small>
                <b><span id="aberturaNumero">0</span><i>%</i></b>
            </div>
        </div>`)

    inicioAbertura = Date.now()
    circulosNoComeco = circulosAparecendo()

    // a cada 15 milésimos de segundo o número sobe um pouco
    relogioAbertura = setInterval(subirAbertura, 15)
}

// Conta os círculos de "carregando" que estão aparecendo na página
// (offsetParent == null quer dizer que o elemento está escondido)
function circulosAparecendo(){
    var circulos = document.querySelectorAll('.carregando')
    var quantos = 0

    for(var i = 0; i < circulos.length; i++){
        if(circulos[i].offsetParent != null){
            quantos++
        }
    }

    return quantos
}

function subirAbertura(){
    var alvo = 100

    // ainda tem lista carregando: o número só vai até onde já carregou
    if(circulosNoComeco > 0){
        var sumiram = circulosNoComeco - circulosAparecendo()
        alvo = Math.floor(sumiram / circulosNoComeco * 100)
    }

    // se o servidor demorar mais de 8 segundos, a abertura sai mesmo assim
    if(Date.now() - inicioAbertura > 8000){
        alvo = 100
    }

    if(numeroAbertura < alvo){
        numeroAbertura = numeroAbertura + 1
        document.getElementById('aberturaNumero').textContent = numeroAbertura
        document.getElementById('aberturaBarra').value = numeroAbertura
    }

    if(numeroAbertura >= 100){
        clearInterval(relogioAbertura)
        tirarAbertura()
    }
}

// a saída: o "peak." e o número somem, a tela escura apaga devagar
// e o site aparece chegando um pouquinho mais perto (as animações estão no style.css)
function tirarAbertura(){
    document.getElementById('abertura').classList.add('saindo')
    document.documentElement.classList.remove('abrindo')
    document.body.classList.add('chegando')

    // depois que a animação termina, a abertura é apagada da página
    setTimeout(function(){
        document.getElementById('abertura').remove()
        document.body.classList.remove('chegando')
    }, 1600)
}

criarAbertura()


// =====================================================
// 3. SEGREDINHO (easter egg)
// =====================================================
// 3 cliques rápidos no topo da página ("Boa noite, fulano"; no celular, o "Peak" lá em cima)
// abrem o livro "A equipe Peak" direto no capítulo "Quem somos".
var cliquesSegredo = 0
var relogioSegredo = null

function contarCliqueSegredo(){
    cliquesSegredo = cliquesSegredo + 1

    // se passar 1 segundo sem clicar, a contagem volta a zero
    clearTimeout(relogioSegredo)
    relogioSegredo = setTimeout(function(){
        cliquesSegredo = 0
    }, 1000)

    if(cliquesSegredo == 3){
        cliquesSegredo = 0
        avisar('Você achou um segredo!', 'Conheça quem fez a Peak…', 'info', function(){
            window.location.href = 'livro-equipe.html#cap-2'
        })
    }
}

if(document.querySelector('.topo')){
    document.querySelector('.topo').addEventListener('click', contarCliqueSegredo)
}


// =====================================================
// 4. O SITE NO NATAL (pisca-pisca, neve, bonequinhas e o menu de Natal)
// =====================================================
// Como funciona (igual ao modo escuro, para a página não "piscar"):
//   1. Se da última vez era Natal (localStorage 'natal' = 'sim'), o Natal liga NA HORA.
//   2. Ao mesmo tempo pergunta ao servidor se tem evento de Natal agora (/eventos/ativo).
//   3. Servidor disse que é Natal: liga (se ainda não ligou) e guarda 'sim'.
//      Servidor disse que NÃO é: desliga tudo e apaga o 'sim'.
function verNatal(){
    if(localStorage.getItem('natal') == 'sim'){
        ligarNatal()
    }

    buscar('/eventos/ativo', function(evento){
        if(evento.tema == 'natal'){
            localStorage.setItem('natal', 'sim')
            ligarNatal()
        }else{
            localStorage.removeItem('natal')
            desligarNatal()
        }
    })
}

// ----- A MÚSICA DE NATAL: toca em todas as páginas enquanto o site está no Natal -----
// "Audio" é o tocador de som do navegador (o mesmo do mapa). O volume vai de 0 a 1.
// O que fica guardado no navegador:
//   localStorage 'musicaNatal'        -> 'ligada' ou 'pausada' (a escolha da pessoa vale em todas as páginas)
//   sessionStorage 'musicaNatalTempo' -> em que segundo a música estava (para continuar de onde parou)
var musicaNatal = new Audio('../sons/presente-musica.mp3')
musicaNatal.volume = 0.2
musicaNatal.loop = true          // quando acaba, começa de novo

// enquanto toca, guarda o segundo em que está
musicaNatal.ontimeupdate = function(){
    sessionStorage.setItem('musicaNatalTempo', musicaNatal.currentTime)
}

// começa (ou continua) a música e guarda que ela está ligada
function tocarMusicaNatal(){
    var botao = document.getElementById('botaoMusicaNatal')

    // o botão só existe quando o site está no Natal (quem cria é o ligarNatal)
    if(botao == null){
        return
    }

    localStorage.setItem('musicaNatal', 'ligada')
    botao.classList.remove('pausada')
    botao.title = 'Pausar a música'

    // o navegador só deixa tocar som depois que a pessoa clicou em algo no site.
    // Se ele não deixar (catch), a música começa no primeiro clique.
    musicaNatal.play().catch(function(){
        document.addEventListener('click', tocarNoPrimeiroClique)
    })
}

function tocarNoPrimeiroClique(){
    document.removeEventListener('click', tocarNoPrimeiroClique)

    if(localStorage.getItem('musicaNatal') == 'ligada'){
        musicaNatal.play()
    }
}

// o botão do som: se está tocando, pausa; se está pausada, volta a tocar
function trocarMusicaNatal(){
    var botao = document.getElementById('botaoMusicaNatal')

    if(musicaNatal.paused){
        tocarMusicaNatal()
    }else{
        musicaNatal.pause()
        localStorage.setItem('musicaNatal', 'pausada')
        botao.classList.add('pausada')       // o CSS troca a imagem para o som desligado
        botao.title = 'Tocar a música'
    }
}

// O body ganha a classe "natal-site" (o style.css troca as cores e o menu),
// entra o pisca-pisca na borda do menu, uma bonequinha do lado do título e a neve.
function ligarNatal(){
    if(document.body.classList.contains('natal-site')){
        return          // já está ligado
    }

    document.body.classList.add('natal-site')

    // a bonequinha: sorteia um número de 1 a 7 (Math.random dá um número entre 0 e 0,999...)
    // e o body ganha a classe "boneca-3", por exemplo. Qual imagem é cada número está no style.css.
    var numero = Math.floor(Math.random() * 7) + 1
    document.body.classList.add('boneca-' + numero)

    // o pisca-pisca: uma faixa presa na borda do menu (a imagem está no style.css)
    var luzes = document.createElement('div')
    luzes.className = 'natal-luzes'
    document.body.appendChild(luzes)

    // a neve: uma div por cima do site. Os flocos caindo são só CSS (@keyframes nevar, no style.css)
    var neve = document.createElement('div')
    neve.className = 'natal-neve'
    document.body.appendChild(neve)

    // o botão do som da música de Natal (no canto, em cima do dado)
    var botao = document.createElement('button')
    botao.type = 'button'
    botao.className = 'musica-natal pausada'
    botao.id = 'botaoMusicaNatal'
    botao.title = 'Tocar a música'
    botao.onclick = trocarMusicaNatal
    document.body.appendChild(botao)

    // a música continua de onde parou na outra página
    var tempo = sessionStorage.getItem('musicaNatalTempo')

    if(tempo != null){
        musicaNatal.currentTime = Number(tempo)
    }

    // se a pessoa deixou ligada, continua tocando nesta página
    if(localStorage.getItem('musicaNatal') == 'ligada'){
        tocarMusicaNatal()
    }
}

// O Natal acabou: tira a classe, o pisca-pisca e a neve
function desligarNatal(){
    if(!document.body.classList.contains('natal-site')){
        return          // já está desligado
    }

    document.body.classList.remove('natal-site')
    document.querySelector('.natal-luzes').remove()
    document.querySelector('.natal-neve').remove()

    // a música para e o botão dela some
    musicaNatal.pause()
    document.getElementById('botaoMusicaNatal').remove()

    // tira a bonequinha (a classe de 1 a 7 que foi sorteada)
    for(var i = 1; i <= 7; i++){
        document.body.classList.remove('boneca-' + i)
    }
}

// Liga o Natal nas páginas de dentro (as que têm o menu lateral) de quem está logado.
// Antes ficava dentro do verificarLogin (script.js); agora a aparência fica toda aqui.
if(document.querySelector('.lateral') && localStorage.getItem('token') != null){
    verNatal()
}
