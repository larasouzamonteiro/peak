// campanhas.js  (página campanhas.html)
// Mostra as minhas campanhas e as oficiais da Peak, e deixa entrar numa campanha com o código.

var campanhas = []        // as minhas (sou Mestre ou jogador)
var oficiais = []         // as oficiais da Peak
var oficialAberta = null  // id da campanha oficial que está aberta na janela

if(verificarLogin()){
    carregarCampanhas()
    carregarOficiais()
    carregarFichas()
}

function carregarCampanhas(){
    buscar('/campanhas', function(lista){
        campanhas = lista
        desenharMinhas()
    })
}

function carregarOficiais(){
    buscar('/campanhas/oficiais', function(lista){
        oficiais = lista
        desenharOficiais()

        // veio do presente de Natal (campanhas.html?oficial=9): já abre a janela dessa campanha
        if(parametro('oficial') != null){
            abrirOficial(parametro('oficial'))
        }
    })
}

// As minhas fichas viram as opções do <select id="ficha"> (para entrar com o código)
function carregarFichas(){
    buscar('/fichas', function(fichas){
        var html = '<option value="">Escolha a ficha</option>'

        for(var i = 0; i < fichas.length; i++){
            html += '<option value="' + fichas[i].id + '">' + seguro(fichas[i].nome) + '</option>'
        }

        document.getElementById('ficha').innerHTML = html
    })
}


// =====================================================
// SUAS CAMPANHAS
// =====================================================

// Desenha em <div id="listaMinhas"> um card para cada campanha minha
// e, no final, o quadro "Criar campanha"
function desenharMinhas(){
    var eu = pegarUsuarioLogado()
    var html = ''

    for(var i = 0; i < campanhas.length; i++){
        var c = campanhas[i]
        var souMestre = (c.usuarioMestreId == eu.id)

             // VISUAL: a campanha copiada de uma oficial de Natal fica decorada para sempre
        // (sem "Tempo limitado" e sem NOVO: ela é da pessoa e não some depois do evento)
        var classeCard = 'foto-card'
        var neve = ''

        if(c.tema){
            classeCard += ' card-evento'
            neve = '<span class="neve-carta"></span>'
        }

        // o selo e a frase mudam se eu sou o mestre ou estou jogando
        var classeSelo = ''
        var selo = 'Jogando'
        var frase = 'mestre: ' + seguro(c.mestre)

        if(souMestre){
            classeSelo = 'selo-escuro'
            selo = 'Mestre'
            frase = 'você é o mestre'
        }

        html += `
            <a class="${classeCard}" href="campanha.html?id=${c.id}">
                ${neve}
                ${htmlFoto(c.imagemCapa, 'campanha')}
                <div class="etiquetas"><span class="selo ${classeSelo}">${selo}</span></div>
                <div class="nome">
                    <b>${seguro(c.nome)}</b>
                    <small>${frase}</small>
                </div>
            </a>`
    }

    html += `
        <a class="card-novo" href="criar-campanha.html">
            <img class="card-novo-foto" src="../img/criar/nova-campanha.jpg" alt="">
            <span class="card-novo-mais">+</span>
            <b>Nova campanha</b>
            <small>chame o seu grupo</small>
        </a>`

    document.getElementById('listaMinhas').innerHTML = html
}

// O jogador digitou o código e escolheu a ficha
function entrarNaCampanha(){
    var dados = {
        codigo: document.getElementById('codigo').value.trim().toUpperCase(),
        fichaId: document.getElementById('ficha').value
    }

    enviar('/campanhas/entrar', dados, function(resposta){

        if(resposta.hasOwnProperty('error')){
            avisar('Não deu certo', resposta.error, 'erro')
            return
        }

        avisar(resposta.message, 'Levando você para a campanha…', 'certo', function(){
            window.location.href = 'campanha.html?id=' + resposta.id
        })
    })
}


// =====================================================
// CAMPANHAS OFICIAIS
// =====================================================

// Desenha em <div id="listaOficiais"> um card para cada campanha oficial
function desenharOficiais(){
    var html = ''

    for(var i = 0; i < oficiais.length; i++){
        var c = oficiais[i]

        // VISUAL: a campanha de evento (ex.: Natal) ganha a classe "card-evento", a neve e o "Tempo limitado"
        var classeCard = 'foto-card'
        var extras = ''
        var prazo = ''

        if(c.tema){
            classeCard += ' card-evento'
            extras = '<span class="neve-carta"></span>'
            prazo = '<span class="prazo-evento">Tempo limitado</span>'

            // o NOVO só nos 7 primeiros dias do evento
            if(c.novo > 0){
                extras += '<span class="selo-novo">NOVO</span>'
            }
        }

        // quem criou a campanha (se não tiver nome, é uma aventura pronta)
        var criadaPor = 'aventura pronta'

        if(c.criadaPor){
            criadaPor = 'criada por ' + seguro(c.criadaPor)
        }

        html += `
            <button type="button" class="${classeCard}" onclick="abrirOficial(${c.id})">
                ${extras}
                ${htmlFoto(c.imagemCapa, 'campanha')}
                <div class="etiquetas"><span class="selo">Oficial</span></div>
                <div class="nome">
                    <b>${seguro(c.nome)}</b>
                    <small>${criadaPor}</small>
                </div>
                ${prazo}
            </button>`
    }

    if(html == ''){
        html = '<p class="texto-suave">Nenhuma campanha oficial no momento.</p>'
    }

    document.getElementById('listaOficiais').innerHTML = html
}

// Preenche a janela <div id="janelaOficial"> com a campanha clicada e abre
function abrirOficial(id){
    oficialAberta = id

    for(var i = 0; i < oficiais.length; i++){
        if(oficiais[i].id == id){
            var c = oficiais[i]

            document.getElementById('oficialNome').textContent = c.nome

            // sem capa, entra a capa padrão (fotoPadrao, do script.js)
            if(c.imagemCapa){
                document.getElementById('oficialCapa').src = c.imagemCapa
            }else{
                document.getElementById('oficialCapa').src = fotoPadrao('campanha')
            }

            document.getElementById('oficialDescricao').textContent = c.descricao
            document.getElementById('oficialHistoria').textContent = c.historia
            if(c.criadaPor){
                document.getElementById('oficialCriadaPor').textContent = 'Criada por ' + c.criadaPor
            }else{
                document.getElementById('oficialCriadaPor').textContent = ''
            }
        }
    }

    abrirJanela('janelaOficial')
}

// Fechar a janela da campanha oficial.
// Se a pessoa veio do presente de Natal (?voltar=presente), volta para o Início com as cartas abertas.
function fecharOficial(){
    if(parametro('voltar') == 'presente'){
        window.location.href = 'inicio.html?presente=1'
        return
    }

    fecharJanela('janelaOficial')
}

// Botão "Usar como minha campanha": o servidor cria uma cópia com a pessoa de Mestre
function usarOficial(){
    enviar('/campanhas/usar-oficial', {id: oficialAberta}, function(dados){

        if(dados.hasOwnProperty('error')){
            avisar('Não deu certo', dados.error, 'erro')
            return
        }

        avisar(dados.message, 'Levando você para a campanha…', 'certo', function(){
            window.location.href = 'campanha.html?id=' + dados.id
        })
    })
}
