// mapa.js  (página mapa.html?id=3)
// A mesa do Mestre para usar na sessão (compartilhando a tela):
//   - o mapa no meio, com as bolinhas dos personagens e dos monstros
//   - a iniciativa (quem joga primeiro)
//   - música, sons rápidos e dados
// Nada daqui vai para o banco: as bolinhas e a iniciativa só existem nesta tela.

// "Audio" é o tocador de som do navegador. Um para a música (que fica repetindo)
// e outro para os sons rápidos.
var musica = new Audio()
var som = new Audio()

var campanhaId = parametro('id')     // o ?id= do endereço
var mapa = document.getElementById('mapa')

// a lista da iniciativa: um objeto por personagem ou monstro
//   {nome, foto, vida, iniciativa, monstro}
var mesa = []
var vez = 0         // de quem é a vez (posição na lista)
var rodada = 1

// Esta página não tem o menu lateral, por isso não usa o verificarLogin()
// (ele escreve o nome no menu). Aqui só confere se tem alguém logado.
if(pegarUsuarioLogado() == null || localStorage.getItem('token') == null){
    window.location.href = 'login.html'
}else{
    abrirMesa()
}

function abrirMesa(){
    // VISUAL: tema da mesa (claro ou escuro) guardado no navegador
    var tema = localStorage.getItem('temaMapa')

    if(tema == null){
        tema = 'escuro'
    }

    mudarTemaMapa(tema)

    // O MAPA QUE ABRE: na primeira vez, o Teatro; depois, o último que a pessoa usou
    var ultimo = localStorage.getItem('ultimoMapa')

    if(ultimo == null){
        ultimo = '../img/cenas/teatro.jpg'
    }

    mostrarImagem(ultimo)

    // o link "Voltar" leva para a campanha e mostra o nome dela
    if(campanhaId != null){
        document.getElementById('linkVoltar').href = 'campanha.html?id=' + campanhaId

        buscar('/campanha?id=' + campanhaId, function(campanha){
            if(!campanha.hasOwnProperty('error')){
                document.getElementById('nomeCampanha').textContent = campanha.nome
            }
        })

        carregarMesa()
    }else{
        desenharIniciativa()
    }
}


// =====================================================
// 1. O MAPA
// =====================================================

// Mostra a imagem no meio e no fundo borrado, e guarda como "último mapa"
function mostrarImagem(endereco){
    document.getElementById('mapaImagem').src = endereco
    document.getElementById('mapaBorrado').src = endereco

    // o localStorage só aguenta uns 5 MB: um mapa enviado muito grande pode não caber.
    // O try/catch evita que a página pare se não couber (aí só não fica guardado).
    try{
        localStorage.setItem('ultimoMapa', endereco)
    }catch(erro){
        console.log('O mapa é grande demais para guardar no navegador.')
    }

    // marca a miniatura do mapa escolhido (classe "on")
    var botoes = document.querySelectorAll('#cenas button')

    for(var i = 0; i < botoes.length; i++){
        var caminho = botoes[i].querySelector('img').getAttribute('src')
        botoes[i].classList.toggle('on', caminho == endereco)
    }
}

// Miniaturas de cima
function usarCenario(caminho){
    mostrarImagem(caminho)
}

// O "+": a pessoa escolheu um arquivo em <input id="mapaArquivo">
// (aqui a imagem pode ser maior, porque não vai para o banco: o limite é 5000 KB)
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

// VISUAL: tema da mesa. tema: 'claro' ou 'escuro'
function mudarTemaMapa(tema){
    localStorage.setItem('temaMapa', tema)

    document.body.classList.toggle('mapa-claro', tema == 'claro')
    document.body.classList.toggle('mapa-escuro', tema != 'claro')
    document.getElementById('botaoClaro').classList.toggle('ativo', tema == 'claro')
    document.getElementById('botaoEscuro').classList.toggle('ativo', tema != 'claro')
}


// =====================================================
// 2. QUEM ESTÁ NA MESA (iniciativa e bolinhas)
// =====================================================
// Rotas que já existem:
//   /campanha/jogadores -> as FICHAS de quem está na campanha (nome, retrato, vidaAtual, vidaMaxima)
//   /campanha/monstros  -> os monstros escolhidos pelo Mestre (nome, imagem, vidaMaxima)
function carregarMesa(){
    buscar('/campanha/jogadores?id=' + campanhaId, function(fichas){
        buscar('/campanha/monstros?id=' + campanhaId, function(monstros){

            if(fichas.hasOwnProperty('error') || monstros.hasOwnProperty('error')){
                desenharIniciativa()
                return
            }

            for(var i = 0; i < fichas.length; i++){
                var f = fichas[i]

                mesa.push({nome: f.nome, foto: f.retrato, vida: f.vidaAtual + '/' + f.vidaMaxima, iniciativa: 0, monstro: false})

                // personagens começam no lado esquerdo do mapa, um embaixo do outro
                criarBolinha(f.nome, f.retrato, 20, 40 + i * 8, false)
            }

            for(var j = 0; j < monstros.length; j++){
                var m = monstros[j]

                mesa.push({nome: m.nome, foto: m.imagem, vida: String(m.vidaMaxima), iniciativa: 0, monstro: true})

                // monstros começam no lado direito
                criarBolinha(m.nome, m.imagem, 80, 40 + j * 8, true)
            }

            desenharIniciativa()
        })
    })
}


// =====================================================
// 3. INICIATIVA
// =====================================================
// Cada linha tem uma caixinha para digitar o número que a pessoa tirou no dado.
// "Ordenar" coloca do maior para o menor; "Próximo" passa a vez.

// Escreve as linhas em <div id="listaIniciativa">. A linha de quem é a vez ganha a classe "vez".
function desenharIniciativa(){
    var html = ''

    for(var k = 0; k < mesa.length; k++){
        var linha = 'ini-linha'

        if(mesa[k].monstro){
            linha += ' monstro'
        }

        if(k == vez){
            linha += ' vez'
        }

        html += `
            <div class="${linha}">
                <input class="ini-numero" type="number" value="${mesa[k].iniciativa}" oninput="mudarIniciativa(${k}, this.value)">
                ${htmlFoto(mesa[k].foto, mesa[k].nome)}
                <span>${seguro(mesa[k].nome)}</span>
                <small>${seguro(mesa[k].vida)}</small>
            </div>`
    }

    if(html == ''){
        html = '<p class="ini-vazio">Ninguém na mesa ainda.</p>'
    }

    document.getElementById('listaIniciativa').innerHTML = html
    document.getElementById('rodada').textContent = rodada
}

// Quando digita na caixinha: guarda o número na lista (Number transforma o texto em número)
function mudarIniciativa(posicao, valor){
    mesa[posicao].iniciativa = Number(valor)
}

// ORDENAR (bubble sort): compara cada um com o vizinho e troca se o de baixo for maior.
// Repetindo isso várias vezes, o maior "sobe" para o topo, como uma bolha.
function ordenar(){
    for(var i = 0; i < mesa.length; i++){
        for(var j = 0; j < mesa.length - 1; j++){
            if(mesa[j].iniciativa < mesa[j + 1].iniciativa){
                var guarda = mesa[j]
                mesa[j] = mesa[j + 1]
                mesa[j + 1] = guarda
            }
        }
    }

    vez = 0
    rodada = 1
    desenharIniciativa()
}

// PRÓXIMO: passa a vez. Depois do último, volta para o primeiro e começa uma rodada nova.
function proximo(){
    vez = vez + 1

    if(vez >= mesa.length){
        vez = 0
        rodada = rodada + 1
    }

    desenharIniciativa()
}


// =====================================================
// 4. BOLINHAS (tokens) EM CIMA DO MAPA
// =====================================================

// nome  -> aparece quando passa o mouse (title)
// foto  -> o retrato da ficha ou a imagem do monstro
// x, y  -> posição em PORCENTAGEM do mapa (0 = esquerda/topo, 100 = direita/baixo)
// ehMonstro -> true coloca a borda colorida de monstro
function criarBolinha(nome, foto, x, y, ehMonstro){
    var bola = document.createElement('div')        // cria uma <div> nova

    bola.className = 'token'

    if(ehMonstro){
        bola.classList.add('monstro')
    }

    bola.title = nome
    bola.innerHTML = htmlFoto(foto, nome)            // a foto (ou a letra, se não tiver foto)
    bola.style.left = x + '%'
    bola.style.top = y + '%'

    deixarArrastar(bola)        // liga o "arrastar" nessa bolinha
    mapa.appendChild(bola)      // coloca a bolinha dentro do mapa
}

// ARRASTAR: são 3 momentos do mouse (ou do dedo, no celular):
//   pointerdown -> apertou em cima da bolinha: começa a arrastar
//   pointermove -> mexeu: a bolinha vai junto
//   pointerup   -> soltou: para de arrastar
// "pointer" funciona igual para mouse e para toque na tela.
function deixarArrastar(bola){
    var arrastando = false

    bola.addEventListener('pointerdown', function(evento){
        evento.preventDefault()                     // não deixa o navegador "arrastar a imagem" sozinho
        arrastando = true
        bola.classList.add('arrastando')            // o CSS deixa ela um pouco maior
        bola.setPointerCapture(evento.pointerId)    // continua seguindo mesmo se o mouse sair de cima dela
    })

    bola.addEventListener('pointermove', function(evento){
        if(!arrastando){
            return
        }

        // getBoundingClientRect: onde o mapa está na tela e o tamanho dele
        var caixa = mapa.getBoundingClientRect()

        // posição do mouse DENTRO do mapa, em porcentagem
        var x = (evento.clientX - caixa.left) / caixa.width * 100
        var y = (evento.clientY - caixa.top) / caixa.height * 100

        // não deixa a bolinha sair do mapa
        x = Math.max(0, Math.min(100, x))
        y = Math.max(0, Math.min(100, y))

        bola.style.left = x + '%'
        bola.style.top = y + '%'
    })

    bola.addEventListener('pointerup', function(){
        arrastando = false
        bola.classList.remove('arrastando')
    })
}

// Por que porcentagem e não pixels? Se a tela mudar de tamanho (tela cheia, celular),
// a bolinha continua no MESMO lugar do mapa, porque 50% é sempre o meio.


// VISUAL: a bolinha do mouse (só aparece com o mouse em cima do mapa)
var bolinhaMouse = document.getElementById('mouse')

document.addEventListener('pointermove', function(evento){
    bolinhaMouse.style.left = evento.clientX + 'px'
    bolinhaMouse.style.top = evento.clientY + 'px'
})

mapa.addEventListener('pointerenter', function(){
    bolinhaMouse.classList.add('on')
})

mapa.addEventListener('pointerleave', function(){
    bolinhaMouse.classList.remove('on')
})


// =====================================================
// 5. MÚSICA E SONS
// =====================================================

// arquivo: o caminho (ou o texto da música enviada); nome: o que aparece no card
function tocarMusica(arquivo, nome){
    musica.src = arquivo
    musica.loop = true      // quando acabar, começa de novo
    mudarVolume()
    musica.play()

    document.getElementById('nomeMusica').textContent = nome
    document.getElementById('botaoPlay').textContent = '❚❚'
}

// o botão redondo: se está tocando, pausa; se está pausada (e já tem música), toca
function tocarOuPausar(){
    if(musica.src == ''){
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

// A pessoa escolheu uma música do computador em <input id="musicaArquivo">.
// O FileReader lê o arquivo e transforma em texto (leitor.result),
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
        tocarMusica(leitor.result, arquivo.name)
    }

    leitor.readAsDataURL(arquivo)
}

// O volume do Audio vai de 0 a 1; a barrinha <input id="volume"> vai de 0 a 100
function mudarVolume(){
    musica.volume = document.getElementById('volume').value / 100
}

function tocarSom(arquivo){
    som.src = arquivo
    som.play()
}


// =====================================================
// 6. DADOS
// =====================================================
// lados: 4, 6, 8, 12 ou 20. O número aparece em <span id="dadoNumero">.
function rolarNoMapa(lados){
    var numero = Math.floor(Math.random() * lados) + 1

    document.getElementById('dadoNumero').textContent = numero
}
