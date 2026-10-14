// mapa.js  (página mapa.html?id=3)
// Uma imagem de fundo, uma música e sons rápidos para o Mestre usar na sessão
// (compartilhando a tela). Tudo acontece só nesta página: nada vai para o servidor.

// "Audio" é o tocador de som do navegador. Um para a música (que fica repetindo)
// e outro para os sons rápidos.
var musica = new Audio()
var som = new Audio()

if(verificarLogin()){
    // o link "Voltar" leva para a campanha de onde a pessoa veio (mapa.html?id=3)
    if(parametro('id') != null){
        document.getElementById('linkVoltar').href = 'campanha.html?id=' + parametro('id')
    }
}


// ---------- IMAGEM ----------

// Mostra uma imagem em <img id="mapaImagem"> e esconde o texto <span id="mapaTexto">
function mostrarImagem(endereco){
    document.getElementById('mapaImagem').src = endereco
    document.getElementById('mapaImagem').classList.remove('oculto')
    document.getElementById('mapaTexto').classList.add('oculto')
}

// Botões dos cenários prontos
function usarCenario(caminho){
    mostrarImagem(caminho)
}

// A pessoa escolheu um arquivo em <input id="mapaArquivo">
// (aqui a imagem pode ser maior, porque não vai para o banco: o limite é 5000 KB)
function usarImagemEnviada(){
    lerImagem(document.getElementById('mapaArquivo'), function(imagem){
        if(imagem != ''){
            mostrarImagem(imagem)
        }
    }, 5000)
}

// Deixa a área do mapa ocupando a tela inteira (para sair, aperte Esc)
function telaCheia(){
    document.getElementById('mapaArea').requestFullscreen()
}


// ---------- MÚSICA ----------

function tocarMusica(arquivo){
    musica.src = arquivo
    musica.loop = true      // quando acabar, começa de novo
    mudarVolume()
    musica.play()
}

// A pessoa escolheu uma música do computador em <input id="musicaArquivo">.
// Igual à imagem: o FileReader lê o arquivo e transforma em texto (leitor.result),
// e esse texto vai direto no tocador. Não vai para o servidor nem para o banco.
function usarMusicaEnviada(){
    var arquivo = document.getElementById('musicaArquivo').files[0]

    if(arquivo == undefined){
        return
    }

    if(arquivo.size > 20000 * 1024){
        alert('A música precisa ter no máximo 20 MB.')
        return
    }

    var leitor = new FileReader()

    leitor.onload = function(){
        tocarMusica(leitor.result)
    }

    leitor.readAsDataURL(arquivo)
}

function pausarMusica(){
    musica.pause()
}

// O volume do Audio vai de 0 a 1; a barrinha <input id="volume"> vai de 0 a 100
function mudarVolume(){
    musica.volume = document.getElementById('volume').value / 100
}


// ---------- SONS ----------

function tocarSom(arquivo){
    som.src = arquivo
    som.play()
}
