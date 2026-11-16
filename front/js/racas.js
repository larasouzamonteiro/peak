// racas.js  (página racas.html)
// Mostra as raças em três grupos (da Peak, da comunidade e minhas),
// cria raça nova, edita a descrição e exclui.

var racas = []               // lista que veio do servidor
var racaEditando = null      // id da raça que está aberta na janela de editar

if(verificarLogin()){
    carregarRacas()
}

function carregarRacas(){
    buscar('/racas', function(lista){
        racas = lista
        desenharRacas()
    })
}

// Um card de raça.
// botoes: HTML dos botões Editar e Excluir (só nas minhas; nas outras vem '')
function htmlCardRaca(raca, botoes){
    // VISUAL: a raça de evento (ex.: Natal) ganha a classe "card-evento", a neve e o "Tempo limitado"
    var classe = 'galeria-card'
    var extras = ''
    var prazo = ''

    if(raca.tema){
        classe += ' card-evento'
        extras = '<span class="neve-carta"></span>'
        prazo = '<span class="prazo-evento">Tempo limitado</span>'

        // o NOVO só nos 7 primeiros dias do evento
        if(raca.novo > 0){
            extras += '<span class="selo-novo">NOVO</span>'
        }
    }

    // "por fulano" só aparece se alguém da comunidade criou
    var autor = ''

    if(raca.autor){
        autor = ' · por ' + seguro(raca.autor)
    }

    return `
        <div class="${classe}">
            ${extras}
            <div class="galeria-img">${htmlFoto(raca.imagem, 'raca')}</div>
            <div class="galeria-info">
                <strong>${seguro(raca.nome)}</strong>
                <small>Vida ${raca.vidaMaxima}${autor}</small>
                <p>${seguro(raca.descricao)}</p>
                ${prazo}
                ${botoes}
            </div>
        </div>`
}

// Separa as raças em três grupos e escreve cada um no seu lugar do racas.html:
//   <div id="listaOficiais">    -> usuarioId vazio (da Peak)
//   <div id="listaComunidade">  -> de outras pessoas (só vêm as públicas)
//   <div id="listaMinhas">      -> as que eu criei (com Editar e Excluir)
function desenharRacas(){
    var eu = pegarUsuarioLogado()
    var oficiais = ''
    var comunidade = ''
    var minhas = ''

    for(var i = 0; i < racas.length; i++){
        var r = racas[i]

        if(r.usuarioId == null){
            oficiais += htmlCardRaca(r, '')

        }else if(r.usuarioId == eu.id){
            var visivel = 'Só eu vejo'

            if(r.publico == 1){
                visivel = 'Pública'
            }

            var botoes = `
                <div class="botoes">
                    <span class="selo">${visivel}</span>
                    <button type="button" class="botao-icone editar" title="Editar" aria-label="Editar" onclick="abrirEdicao(${r.id})"></button>
                    <button type="button" class="botao-icone excluir" title="Excluir" aria-label="Excluir" onclick="excluirRaca(${r.id})"></button>
                </div>`

            minhas += htmlCardRaca(r, botoes)

        }else{
            comunidade += htmlCardRaca(r, '')
        }
    }

    if(comunidade == ''){
        comunidade = '<p class="texto-suave">Ninguém compartilhou uma raça ainda.</p>'
    }

    if(minhas == ''){
        minhas = '<p class="texto-suave">Você ainda não criou nenhuma raça.</p>'
    }

    document.getElementById('listaOficiais').innerHTML = oficiais
    document.getElementById('listaComunidade').innerHTML = comunidade
    document.getElementById('listaMinhas').innerHTML = minhas
}

// ---------- CRIAR ----------
function salvarRaca(){

    // primeiro lê a imagem escolhida (pode demorar um instante); quando terminar, manda tudo
    lerImagem(document.getElementById('imagem'), function(imagem){

        var raca = {
            nome: document.getElementById('nome').value.trim(),
            vidaMaxima: document.getElementById('vidaMaxima').value,
            descricao: document.getElementById('descricao').value.trim(),
            imagem: imagem,
            publico: document.getElementById('publico').checked
        }

        enviar('/racas/criar', raca, function(dados){

            if(dados.hasOwnProperty('error')){
                document.getElementById('alert').textContent = dados.error
                return
            }

            avisar(dados.message, '', 'certo')

            // limpa o formulário e mostra a lista de novo
            document.getElementById('nome').value = ''
            document.getElementById('descricao').value = ''
            document.getElementById('imagem').value = ''
            document.getElementById('publico').checked = false
            document.getElementById('alert').textContent = ''
            carregarRacas()
        })
    })
}

// ---------- EDITAR (só a descrição e se é pública) ----------
function abrirEdicao(id){
    racaEditando = id

    for(var i = 0; i < racas.length; i++){
        if(racas[i].id == id){
            document.getElementById('tituloEdicao').textContent = 'Editar ' + racas[i].nome
            document.getElementById('descricaoEdicao').value = racas[i].descricao
            document.getElementById('publicoEdicao').checked = (racas[i].publico == 1)
        }
    }

    abrirJanela('janelaEdicao')
}

function salvarEdicao(){
    var mudancas = {
        id: racaEditando,
        descricao: document.getElementById('descricaoEdicao').value.trim(),
        publico: document.getElementById('publicoEdicao').checked
    }

    enviar('/racas/atualizar', mudancas, function(dados){

        if(dados.hasOwnProperty('error')){
            avisar('Não deu certo', dados.error, 'erro')
            return
        }

        fecharJanela('janelaEdicao')
        carregarRacas()
    })
}

// ---------- EXCLUIR ----------
function excluirRaca(id){
    confirmar('Excluir esta raça?', function(){
        enviar('/racas/excluir', {id: id}, function(dados){

            if(dados.hasOwnProperty('error')){
                avisar('Não deu certo', dados.error, 'erro')
                return
            }

            carregarRacas()
        })
    }, 'Excluir')
}
