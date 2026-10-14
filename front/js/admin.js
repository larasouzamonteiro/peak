// admin.js  (página admin.html)
// Painel do administrador. Ele só cuida do que é OFICIAL:
//   - monstros oficiais (os gerais da Peak e os de cada campanha oficial)
//   - campanhas oficiais
//
// Quem protege de verdade é o servidor: as rotas /admin/... recusam quem não é admin.
// Aqui a página só manda embora quem entrou por engano.

var monstros = []            // só os oficiais (usuarioId vazio)
var campanhas = []           // as campanhas oficiais
var monstroEditando = null   // id do monstro aberto na janela (null = está criando um novo)
var campanhaEditando = null  // id da campanha aberta na janela (null = está criando uma nova)

if(verificarLogin()){
    if(pegarUsuarioLogado().tipo != 'admin'){
        window.location.href = 'inicio.html'
    }else{
        carregarCampanhas()
    }
}

// ABAS: mostra <section id="abaMonstros"> ou <section id="abaCampanhas">
function mostrarAba(nome){
    var abas = ['Monstros', 'Campanhas']

    for(var i = 0; i < abas.length; i++){
        document.getElementById('aba' + abas[i]).classList.toggle('oculto', abas[i] != nome)
        document.getElementById('botaoAba' + abas[i]).classList.toggle('ativo', abas[i] == nome)
    }
}

// Primeiro as campanhas (os monstros precisam delas para mostrar "de onde é"), depois os monstros
function carregarCampanhas(){
    buscar('/campanhas/oficiais', function(lista){
        campanhas = lista
        desenharCampanhas()
        desenharOpcoesDeCampanha()
        carregarMonstros()
    })
}

function carregarMonstros(){
    buscar('/monstros', function(lista){
        monstros = []

        // da lista toda, ficam só os oficiais
        for(var i = 0; i < lista.length; i++){
            if(lista[i].usuarioId == null){
                monstros.push(lista[i])
            }
        }

        desenharMonstros()
    })
}


// =====================================================
// MONSTROS OFICIAIS
// =====================================================

// Uma linha da tabela para cada monstro, em <tbody id="tabelaMonstros">
function desenharMonstros(){
    var html = ''

    for(var i = 0; i < monstros.length; i++){
        var m = monstros[i]

        html += `
            <tr>
                <td>${m.imagem ? '<img class="miniatura" src="' + seguro(m.imagem) + '" alt="">' : ''}</td>
                <td><strong>${seguro(m.nome)}</strong></td>
                <td>${m.campanhaOficial ? seguro(m.campanhaOficial) : 'Peak (geral)'}</td>
                <td>${m.vidaMaxima}</td>
                <td>${m.defesa}</td>
                <td>
                    <div class="botoes">
                        <button type="button" class="botao botao-pequeno" onclick="editarMonstro(${m.id})">Editar</button>
                        <button type="button" class="botao botao-pequeno" onclick="excluirMonstro(${m.id})">Excluir</button>
                    </div>
                </td>
            </tr>`
    }

    if(html == ''){
        html = '<tr><td colspan="6" class="texto-suave">Nenhum monstro oficial ainda.</td></tr>'
    }

    document.getElementById('tabelaMonstros').innerHTML = html
}

// As opções do <select id="monstroCampanha">: "Peak (geral)" e cada campanha oficial
function desenharOpcoesDeCampanha(){
    var html = '<option value="">Peak (serve para qualquer campanha)</option>'

    for(var i = 0; i < campanhas.length; i++){
        html += '<option value="' + campanhas[i].id + '">' + seguro(campanhas[i].nome) + '</option>'
    }

    document.getElementById('monstroCampanha').innerHTML = html
}

// Abre a janela vazia, para criar
function novoMonstro(){
    monstroEditando = null

    document.getElementById('tituloMonstro').textContent = 'Novo monstro oficial'
    document.getElementById('monstroNome').value = ''
    document.getElementById('monstroCampanha').value = ''
    document.getElementById('monstroDescricao').value = ''
    document.getElementById('monstroVida').value = 10
    document.getElementById('monstroDefesa').value = 10
    document.getElementById('monstroImagem').value = ''
    document.getElementById('alertMonstro').textContent = ''

    abrirJanela('janelaMonstro')
}

// Abre a janela preenchida com o monstro clicado, para editar
function editarMonstro(id){
    monstroEditando = id

    for(var i = 0; i < monstros.length; i++){
        if(monstros[i].id == id){
            var m = monstros[i]

            document.getElementById('tituloMonstro').textContent = 'Editar ' + m.nome
            document.getElementById('monstroNome').value = m.nome
            document.getElementById('monstroCampanha').value = m.campanhaOficialId || ''
            document.getElementById('monstroDescricao').value = m.descricao
            document.getElementById('monstroVida').value = m.vidaMaxima
            document.getElementById('monstroDefesa').value = m.defesa
        }
    }

    document.getElementById('monstroImagem').value = ''
    document.getElementById('alertMonstro').textContent = ''

    abrirJanela('janelaMonstro')
}

// O mesmo botão Salvar cria (monstroEditando == null) ou edita
function salvarMonstro(){
    lerImagem(document.getElementById('monstroImagem'), function(imagem){

        var monstro = {
            nome: document.getElementById('monstroNome').value.trim(),
            campanhaOficialId: document.getElementById('monstroCampanha').value,
            descricao: document.getElementById('monstroDescricao').value.trim(),
            vidaMaxima: document.getElementById('monstroVida').value,
            defesa: document.getElementById('monstroDefesa').value,
            imagem: imagem
        }

        var rota = '/admin/monstros/criar'

        if(monstroEditando != null){
            rota = '/admin/monstros/atualizar'
            monstro.id = monstroEditando
        }

        enviar(rota, monstro, function(dados){

            if(dados.hasOwnProperty('error')){
                document.getElementById('alertMonstro').textContent = dados.error
                return
            }

            fecharJanela('janelaMonstro')
            carregarMonstros()
        })
    })
}

function excluirMonstro(id){
    if(!confirm('Excluir este monstro oficial?')){
        return
    }

    enviar('/admin/monstros/excluir', {id: id}, function(dados){

        if(dados.hasOwnProperty('error')){
            alert(dados.error)
            return
        }

        carregarMonstros()
    })
}


// =====================================================
// CAMPANHAS OFICIAIS
// =====================================================

// Um card para cada campanha oficial, em <div id="listaCampanhas">
function desenharCampanhas(){
    var html = ''

    for(var i = 0; i < campanhas.length; i++){
        var c = campanhas[i]

        html += `
            <div class="card card-com-imagem">
                ${c.imagemCapa ? '<img class="capa" src="' + seguro(c.imagemCapa) + '" alt="">' : ''}
                <div class="card-corpo">
                    <span class="selo">Campanha oficial</span>
                    <h3 class="card-titulo">${seguro(c.nome)}</h3>
                    <p class="texto-suave">Criada por ${seguro(c.criadaPor || 'Equipe Peak')}</p>
                    <p class="card-texto">${seguro(c.descricao)}</p>
                    <div class="botoes">
                        <button type="button" class="botao botao-pequeno" onclick="editarCampanha(${c.id})">Editar</button>
                        <button type="button" class="botao botao-pequeno" onclick="excluirCampanha(${c.id})">Excluir</button>
                    </div>
                </div>
            </div>`
    }

    if(html == ''){
        html = '<p class="texto-suave">Nenhuma campanha oficial ainda.</p>'
    }

    document.getElementById('listaCampanhas').innerHTML = html
}

function novaCampanha(){
    campanhaEditando = null

    document.getElementById('tituloCampanha').textContent = 'Nova campanha oficial'
    document.getElementById('campanhaNome').value = ''
    document.getElementById('campanhaCriadaPor').value = ''
    document.getElementById('campanhaDescricao').value = ''
    document.getElementById('campanhaHistoria').value = ''
    document.getElementById('campanhaCapa').value = ''
    document.getElementById('alertCampanha').textContent = ''

    abrirJanela('janelaCampanha')
}

function editarCampanha(id){
    campanhaEditando = id

    for(var i = 0; i < campanhas.length; i++){
        if(campanhas[i].id == id){
            var c = campanhas[i]

            document.getElementById('tituloCampanha').textContent = 'Editar ' + c.nome
            document.getElementById('campanhaNome').value = c.nome
            document.getElementById('campanhaCriadaPor').value = c.criadaPor
            document.getElementById('campanhaDescricao').value = c.descricao
            document.getElementById('campanhaHistoria').value = c.historia
        }
    }

    document.getElementById('campanhaCapa').value = ''
    document.getElementById('alertCampanha').textContent = ''

    abrirJanela('janelaCampanha')
}

// O mesmo botão Salvar cria (campanhaEditando == null) ou edita
function salvarCampanha(){
    lerImagem(document.getElementById('campanhaCapa'), function(imagem){

        var campanha = {
            nome: document.getElementById('campanhaNome').value.trim(),
            criadaPor: document.getElementById('campanhaCriadaPor').value.trim(),
            descricao: document.getElementById('campanhaDescricao').value.trim(),
            historia: document.getElementById('campanhaHistoria').value.trim(),
            imagemCapa: imagem
        }

        var rota = '/admin/campanhas/criar'

        if(campanhaEditando != null){
            rota = '/admin/campanhas/atualizar'
            campanha.id = campanhaEditando
        }

        enviar(rota, campanha, function(dados){

            if(dados.hasOwnProperty('error')){
                document.getElementById('alertCampanha').textContent = dados.error
                return
            }

            fecharJanela('janelaCampanha')
            carregarCampanhas()
        })
    })
}

function excluirCampanha(id){
    if(!confirm('Excluir esta campanha oficial? Os monstros dela são apagados junto.')){
        return
    }

    enviar('/admin/campanhas/excluir', {id: id}, function(dados){

        if(dados.hasOwnProperty('error')){
            alert(dados.error)
            return
        }

        carregarCampanhas()
    })
}
