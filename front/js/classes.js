// classes.js  (página classes.html)
// Funciona igual ao racas.js: mostra as classes em três grupos (da Peak, da comunidade
// e minhas), cria classe nova, edita a descrição e exclui.

var classes = []               // lista que veio do servidor
var classeEditando = null      // id da classe que está aberta na janela de editar

if(verificarLogin()){
    carregarClasses()
}

function carregarClasses(){
    buscar('/classes', function(lista){
        classes = lista
        desenharClasses()
    })
}

// Um card de classe.
// botoes: HTML dos botões Editar e Excluir (só nas minhas; nas outras vem '')
function htmlCardClasse(classe, botoes){
    // VISUAL: a classe de evento (ex.: Natal) ganha a classe "card-evento", a neve e o "Tempo limitado"
    var classeCss = 'galeria-card'
    var extras = ''
    var prazo = ''

    if(classe.tema){
        classeCss += ' card-evento'
        extras = '<span class="neve-carta"></span>'
        prazo = '<span class="prazo-evento">Tempo limitado</span>'

        // o NOVO só nos 7 primeiros dias do evento
        if(classe.novo > 0){
            extras += '<span class="selo-novo">NOVO</span>'
        }
    }

    // quem criou: alguém da comunidade ou a Peak
    var autor = 'Classe da Peak'

    if(classe.autor){
        autor = 'por ' + seguro(classe.autor)
    }

    return `
        <div class="${classeCss}">
            ${extras}
            <div class="galeria-img">${htmlFoto(classe.imagem, 'classe')}</div>
            <div class="galeria-info">
                <strong>${seguro(classe.nome)}</strong>
                <small>${autor}</small>
                <p>${seguro(classe.descricao)}</p>
                ${prazo}
                ${botoes}
            </div>
        </div>`
}

// Separa as classes em três grupos e escreve cada um no seu lugar do classes.html:
//   <div id="listaOficiais">    -> usuarioId vazio (da Peak)
//   <div id="listaComunidade">  -> de outras pessoas (só vêm as públicas)
//   <div id="listaMinhas">      -> as que eu criei (com Editar e Excluir)
function desenharClasses(){
    var eu = pegarUsuarioLogado()
    var oficiais = ''
    var comunidade = ''
    var minhas = ''

    for(var i = 0; i < classes.length; i++){
        var c = classes[i]

        if(c.usuarioId == null){
            oficiais += htmlCardClasse(c, '')

        }else if(c.usuarioId == eu.id){
            var visivel = 'Só eu vejo'

            if(c.publico == 1){
                visivel = 'Pública'
            }

            var botoes = `
                <div class="botoes">
                    <span class="selo">${visivel}</span>
                    <button type="button" class="botao-icone editar" title="Editar" aria-label="Editar" onclick="abrirEdicao(${c.id})"></button>
                    <button type="button" class="botao-icone excluir" title="Excluir" aria-label="Excluir" onclick="excluirClasse(${c.id})"></button>
                </div>`

            minhas += htmlCardClasse(c, botoes)

        }else{
            comunidade += htmlCardClasse(c, '')
        }
    }

    if(comunidade == ''){
        comunidade = '<p class="texto-suave">Ninguém compartilhou uma classe ainda.</p>'
    }

    if(minhas == ''){
        minhas = '<p class="texto-suave">Você ainda não criou nenhuma classe.</p>'
    }

    document.getElementById('listaOficiais').innerHTML = oficiais
    document.getElementById('listaComunidade').innerHTML = comunidade
    document.getElementById('listaMinhas').innerHTML = minhas
}

// ---------- CRIAR ----------
function salvarClasse(){

    // primeiro lê a imagem escolhida (pode demorar um instante); quando terminar, manda tudo
    lerImagem(document.getElementById('imagem'), function(imagem){

        var classe = {
            nome: document.getElementById('nome').value.trim(),
            descricao: document.getElementById('descricao').value.trim(),
            imagem: imagem,
            publico: document.getElementById('publico').checked
        }

        enviar('/classes/criar', classe, function(dados){

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
            carregarClasses()
        })
    })
}

// ---------- EDITAR (só a descrição e se é pública) ----------
function abrirEdicao(id){
    classeEditando = id

    for(var i = 0; i < classes.length; i++){
        if(classes[i].id == id){
            document.getElementById('tituloEdicao').textContent = 'Editar ' + classes[i].nome
            document.getElementById('descricaoEdicao').value = classes[i].descricao
            document.getElementById('publicoEdicao').checked = (classes[i].publico == 1)
        }
    }

    abrirJanela('janelaEdicao')
}

function salvarEdicao(){
    var mudancas = {
        id: classeEditando,
        descricao: document.getElementById('descricaoEdicao').value.trim(),
        publico: document.getElementById('publicoEdicao').checked
    }

    enviar('/classes/atualizar', mudancas, function(dados){

        if(dados.hasOwnProperty('error')){
            avisar('Não deu certo', dados.error, 'erro')
            return
        }

        fecharJanela('janelaEdicao')
        carregarClasses()
    })
}

// ---------- EXCLUIR ----------
function excluirClasse(id){
    confirmar('Excluir esta classe?', function(){
        enviar('/classes/excluir', {id: id}, function(dados){

            if(dados.hasOwnProperty('error')){
                avisar('Não deu certo', dados.error, 'erro')
                return
            }

            carregarClasses()
        })
    }, 'Excluir')
}
