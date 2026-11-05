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

        html += `
            <a class="foto-card" href="campanha.html?id=${c.id}">
                ${htmlFoto(c.imagemCapa, c.nome)}
                <div class="etiquetas"><span class="selo ${souMestre ? 'selo-escuro' : ''}">${souMestre ? 'Mestre' : 'Jogando'}</span></div>
                <div class="nome">
                    <b>${seguro(c.nome)}</b>
                    <small>${souMestre ? 'você é o mestre' : 'mestre: ' + seguro(c.mestre)}</small>
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

        html += `
            <button type="button" class="foto-card" onclick="abrirOficial(${c.id})">
                ${htmlFoto(c.imagemCapa, c.nome)}
                <div class="etiquetas"><span class="selo">Oficial</span></div>
                <div class="nome">
                    <b>${seguro(c.nome)}</b>
                    <small>${c.criadaPor ? 'criada por ' + seguro(c.criadaPor) : 'aventura pronta'}</small>
                </div>
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

            // sem capa, o src ficaria "null" e apareceria o ícone de imagem quebrada:
            // então a imagem só aparece quando a campanha tem capa (igual a capa do perfil)
            if(c.imagemCapa){
                document.getElementById('oficialCapa').src = c.imagemCapa
                document.getElementById('oficialCapa').classList.remove('oculto')
            }else{
                document.getElementById('oficialCapa').classList.add('oculto')
            }

            document.getElementById('oficialDescricao').textContent = c.descricao
            document.getElementById('oficialHistoria').textContent = c.historia
            document.getElementById('oficialCriadaPor').textContent = c.criadaPor ? 'Criada por ' + c.criadaPor : ''
        }
    }

    abrirJanela('janelaOficial')
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
