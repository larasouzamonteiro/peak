// mapa.js  (página mapa.html?id=3)
// O mapa da sessão, para o Mestre mostrar na tela:
//   - a imagem do mapa ocupando a tela toda (3 prontos ou um que a pessoa envia)
//   - a música de fundo (6 do site ou uma que a pessoa envia, só para agora)
// Nada daqui vai para o banco.
// VISUAL: o JS só coloca e tira classes; as cores e os tamanhos estão no mapa.css.

// "Audio" é o tocador de som do navegador
var musica = new Audio()
musica.loop = true          // quando acaba, começa de novo
musica.volume = 0.6         // o volume vai de 0 a 1

var campanhaId = parametro('id')     // o ?id= do endereço

// os 3 mapas prontos
var mapas = [
    {nome: 'Teatro', caminho: '../img/cenas/teatro.jpg'},
    {nome: 'Taverna', caminho: '../img/cenas/taverna.jpg'},
    {nome: 'Salão', caminho: '../img/cenas/salao.jpg'}
]

// as 6 músicas do site (a enviada pela pessoa entra no fim da lista)
var musicas = [
    {nome: 'Taverna', arquivo: '../sons/musicas/taverna.mp3'},
    {nome: 'Batalha', arquivo: '../sons/musicas/batalha.mp3'},
    {nome: 'Mistério', arquivo: '../sons/musicas/misterio.wav'},
    {nome: 'Exploração', arquivo: '../sons/musicas/exploracao.wav'},
    {nome: 'Chuva', arquivo: '../sons/chuva.wav'},
    {nome: 'Épica', arquivo: '../sons/musicas/epica.mp3'}
]
var musicaAtual = -1        // qual música está tocando (-1 = nenhuma)

// Esta página não tem o menu lateral, por isso não usa o verificarLogin().
// Aqui só confere se tem alguém logado.
if(pegarUsuarioLogado() == null || localStorage.getItem('token') == null){
    window.location.href = 'login.html'
}else{
    abrirMapa()
}

function abrirMapa(){
    mostrarImagem(mapas[0].caminho)
    desenharMusicas()

    // o botão "voltar" leva para a campanha e mostra o nome dela
    if(campanhaId != null){
        document.getElementById('linkVoltar').href = 'campanha.html?id=' + campanhaId

        buscar('/campanha?id=' + campanhaId, function(campanha){
            if(!campanha.hasOwnProperty('error')){
                document.getElementById('nomeCampanha').textContent = campanha.nome
            }
        })
    }
}


// =====================================================
// 1. O MAPA
// =====================================================

// Mostra a imagem na tela e marca o mapa escolhido
function mostrarImagem(endereco){
    document.getElementById('mapaImagem').src = endereco
    desenharMapas()
}

// Escreve os 3 mapas prontos. O que está sendo usado ganha a classe "on".
function desenharMapas(){
    var atual = document.getElementById('mapaImagem').getAttribute('src')
    var html = ''

    for(var i = 0; i < mapas.length; i++){
        var classe = 'mapa-opcao'

        if(mapas[i].caminho == atual){
            classe += ' on'
        }

        html += `
            <button type="button" class="${classe}" onclick="mostrarImagem('${mapas[i].caminho}')" title="${mapas[i].nome}">
                <img src="${mapas[i].caminho}" alt="${mapas[i].nome}">
            </button>`
    }

    document.getElementById('listaMapas').innerHTML = html
}

// "+ Enviar o meu mapa": o lerImagem (script.js) transforma a imagem em texto.
// O limite aqui é 5000 KB, porque o mapa não vai para o banco: fica só nesta tela.
function usarImagemEnviada(){
    lerImagem(document.getElementById('mapaArquivo'), function(imagem){
        if(imagem != ''){
            mostrarImagem(imagem)
        }
    }, 5000)
}

// A página inteira ocupa a tela (para sair, aperte Esc)
function telaCheia(){
    document.documentElement.requestFullscreen()
}


// =====================================================
// 2. A MÚSICA
// =====================================================

// Escreve os botões das músicas. A que está tocando ganha a classe "on".
function desenharMusicas(){
    var html = ''

    for(var i = 0; i < musicas.length; i++){
        var classe = ''

        if(i == musicaAtual){
            classe = 'on'
        }

        html += `<button type="button" class="${classe}" onclick="tocarMusica(${i})">${seguro(musicas[i].nome)}</button>`
    }

    document.getElementById('listaMusicas').innerHTML = html
}

// posicao: qual música da lista
function tocarMusica(posicao){
    musicaAtual = posicao

    musica.src = musicas[posicao].arquivo
    musica.play()

    document.getElementById('nomeMusica').textContent = musicas[posicao].nome
    document.getElementById('botaoPlay').textContent = '❚❚'
    desenharMusicas()
}

// O botão redondo: se está tocando, pausa; se está pausada, toca
function tocarOuPausar(){
    if(musicaAtual == -1){
        return
    }

    if(musica.paused){
        musica.play()
        document.getElementById('botaoPlay').textContent = '❚❚'
    }else{
        musica.pause()
        document.getElementById('botaoPlay').textContent = '▶'
    }
}

// A pessoa escolheu uma música do computador.
// O FileReader lê o arquivo e transforma em texto, que vai direto no tocador.
// Ela NÃO vai para o servidor nem para o banco: ao sair da página, some.
function usarMusicaEnviada(){
    var arquivo = document.getElementById('musicaArquivo').files[0]

    if(arquivo == undefined){
        return
    }

    if(arquivo.size > 20000 * 1024){
        avisar('Música grande demais', 'A música precisa ter no máximo 20 MB.', 'erro')
        return
    }

    var leitor = new FileReader()

    leitor.onload = function(){
        // só cabe UMA enviada: se já tinha, troca; se não, entra no fim
        var enviada = {nome: arquivo.name, arquivo: leitor.result}

        if(musicas.length > 5){
            musicas[5] = enviada
        }else{
            musicas.push(enviada)
        }

        tocarMusica(5)
    }

    leitor.readAsDataURL(arquivo)
}

