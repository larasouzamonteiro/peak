// =====================================================
// HISTORIA.JS - usado no historia.html (a estante) e nos 4 livros (livro-NOME.html)
// Tudo é só no navegador: não fala com o servidor nem com o banco.
// Sumário, dicionário e "voltar ao topo" são links de HTML: não estão aqui.
// Aqui só tem o áudio e o marca-texto (que existem só nas páginas dos livros).
// =====================================================

verificarLogin()     // função do script.js: escreve o nome de quem está logado no menu


// ---------- 1. ÁUDIO (a narração) ----------
// No HTML: <button id="botaoAudio" onclick="tocarAudio()"> e <audio id="audio" onended="audioTerminou()">
function tocarAudio(){
    var audio = document.getElementById('audio')
    var botao = document.getElementById('botaoAudio')

    if(audio.paused){
        // play() tenta tocar. Se o arquivo não existir, cai no .catch() e o botão some.
        audio.play().catch(function(){
            audioTerminou()
            esconderAudio()
        })
        botao.textContent = '❚❚ Pausar'
        botao.classList.add('tocando')       // o visual do botão tocando está no css/historia.css
    }else{
        audio.pause()
        botao.textContent = '▶ Continuar'
        botao.classList.remove('tocando')
    }
}

// O áudio chegou no fim (onended): o botão volta ao começo
function audioTerminou(){
    var botao = document.getElementById('botaoAudio')

    botao.textContent = '▶ Ouvir'
    botao.classList.remove('tocando')
}


// Sem o arquivo .mp3 da narração não tem o que ouvir: o botão "Ouvir" some (sem aviso).
function esconderAudio(){
    var botao = document.getElementById('botaoAudio')

    if(botao != null){
        botao.classList.add('oculto')
    }
}

// Confere se a narração existe (só nas páginas dos livros, que têm o <audio>).
// audio.error já preenchido = o arquivo deu erro antes deste script carregar;
// senão, fica esperando o evento "error" (quando o navegador descobrir que o arquivo não existe).
var audioLivro = document.getElementById('audio')

if(audioLivro != null){
    if(audioLivro.error != null){
        esconderAudio()
    }else{
        audioLivro.addEventListener('error', esconderAudio)
    }
}


// ---------- 2. MARCA-TEXTO (faixa que segue o mouse) ----------
// No HTML: <button id="botaoMarcaTexto" onclick="ligarMarcaTexto()"> e <div id="marcaTexto">
var marcaTextoLigado = false

function ligarMarcaTexto(){
    marcaTextoLigado = !marcaTextoLigado

    document.getElementById('marcaTexto').classList.toggle('oculto', !marcaTextoLigado)
    document.getElementById('botaoMarcaTexto').classList.toggle('ativo', marcaTextoLigado)
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
