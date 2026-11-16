// =====================================================
// HISTORIA.JS - usado no historia.html (a estante) e nos 4 livros (livro-NOME.html)
// Tudo é só no navegador: não fala com o servidor nem com o banco.
// Sumário, dicionário e "voltar ao topo" são links de HTML: não estão aqui.
// Aqui só tem o áudio e o marca-texto (que existem só nas páginas dos livros).
// =====================================================

verificarLogin()     // função do script.js: escreve o nome de quem está logado no menu


// ---------- 1. ÁUDIO (a narração gravada pela equipe) ----------
// Nós mesmas narramos cada livro e salvamos o áudio em front/sons/ (ex.: sons/livro-rpg.mp3).
// No HTML: <audio id="audio" src="../sons/livro-rpg.mp3" onended="audioTerminou()">
//          e o botão <button id="botaoAudio" onclick="tocarAudio()">
// O mesmo botão toca e pausa. O visual do botão tocando (classe "tocando") está no historia.css.
function tocarAudio(){
    var audio = document.getElementById('audio')
    var botao = document.getElementById('botaoAudio')

    if(audio.paused){
        audio.play()
        botao.title = 'Pausar'          // o nome que aparece ao passar o mouse
        botao.classList.add('tocando')
    }else{
        audio.pause()
        botao.title = 'Continuar'
        botao.classList.remove('tocando')
    }
}

// O áudio chegou no fim (onended): o botão volta ao começo
function audioTerminou(){
    var botao = document.getElementById('botaoAudio')

    botao.title = 'Ouvir'
    botao.classList.remove('tocando')
}


// ---------- 2. MARCA-TEXTO (faixa que segue o mouse) ----------
// No HTML: <button id="botaoMarcaTexto" onclick="ligarMarcaTexto()"> e <div id="marcaTexto">
var marcaTextoLigado = false

function ligarMarcaTexto(){
    marcaTextoLigado = !marcaTextoLigado

    if(marcaTextoLigado){
        document.getElementById('marcaTexto').classList.remove('oculto')
        document.getElementById('botaoMarcaTexto').classList.add('ativo')
    }else{
        document.getElementById('marcaTexto').classList.add('oculto')
        document.getElementById('botaoMarcaTexto').classList.remove('ativo')
    }
}

// Coloca a faixa na altura "y" da tela (30 = metade da altura dela).
// Única linha em que o JavaScript mexe no "style": a posição muda a cada movimento do mouse.
function moverMarcaTexto(y){
    if(marcaTextoLigado){
        document.getElementById('marcaTexto').style.top = (y - 30) + 'px'
    }
}

document.onmousemove = function(evento){
    moverMarcaTexto(evento.clientY)              // mouse
}

document.ontouchmove = function(evento){
    moverMarcaTexto(evento.touches[0].clientY)   // dedo, no celular
}
