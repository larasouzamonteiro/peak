// admin.js  (página admin.html)
// Painel do administrador. Ele só cuida do que é OFICIAL:
//   - monstros oficiais (os gerais da Peak e os de cada campanha oficial)
//   - campanhas oficiais
//   - raças oficiais e classes oficiais (as que aparecem para todo mundo na Oficina)
//   - avisos da Peak (o mais novo aparece no topo do Início)
//
// Quem protege de verdade é o servidor: as rotas /admin/... recusam quem não é admin.
// Aqui a página só manda embora quem entrou por engano.

var monstros = []            // só os oficiais (usuarioId vazio)
var campanhas = []           // as campanhas oficiais
var monstroEditando = null   // id do monstro aberto na janela (null = está criando um novo)
var campanhaEditando = null  // id da campanha aberta na janela (null = está criando uma nova)
var racas = []               // só as raças oficiais
var classes = []             // só as classes oficiais
var racaEditando = null      // id da raça aberta na janela (null = está criando uma nova)
var classeEditando = null    // id da classe aberta na janela (null = está criando uma nova)

if(verificarLogin()){
    if(pegarUsuarioLogado().tipo != 'admin'){
        window.location.href = 'inicio.html'
    }else{
        carregarCampanhas()
        carregarRacas()
        carregarClasses()
        carregarAvisos()
    }
}

// ABAS: mostra só uma <section id="aba..."> e esconde as outras
function mostrarAba(nome){
    var abas = ['Monstros', 'Campanhas', 'Racas', 'Classes', 'Avisos']

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
                        <button type="button" class="botao-icone editar" title="Editar" aria-label="Editar" onclick="editarMonstro(${m.id})"></button>
                        <button type="button" class="botao-icone excluir" title="Excluir" aria-label="Excluir" onclick="excluirMonstro(${m.id})"></button>
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
    confirmar('Excluir este monstro oficial?', function(){
        enviar('/admin/monstros/excluir', {id: id}, function(dados){

            if(dados.hasOwnProperty('error')){
                avisar('Não deu certo', dados.error, 'erro')
                return
            }

            carregarMonstros()
        })
    }, 'Excluir')
}


// =====================================================
// CAMPANHAS OFICIAIS
// =====================================================

// VISUAL: a capa entra duas vezes no card: uma borrada (o fundo atrás do texto)
// e uma nítida e inteira em cima, que vai sumindo embaixo
function capaDoCard(imagem){
    var src = seguro(imagem)
    return '<img class="capa-fundo" src="' + src + '" alt="">' +
           '<img class="capa" src="' + src + '" alt="">'
}

// Um card para cada campanha oficial, em <div id="listaCampanhas">
function desenharCampanhas(){
    var html = ''

    for(var i = 0; i < campanhas.length; i++){
        var c = campanhas[i]

        html += `
            <div class="card-campanha">
                ${c.imagemCapa ? capaDoCard(c.imagemCapa) : ''}
                <div class="botoes-canto">
                    <button type="button" class="botao-icone na-foto editar" title="Editar" aria-label="Editar" onclick="editarCampanha(${c.id})"></button>
                    <button type="button" class="botao-icone na-foto excluir" title="Excluir" aria-label="Excluir" onclick="excluirCampanha(${c.id})"></button>
                </div>
                <div class="card-corpo">
                    <span class="selo">Campanha oficial</span>
                    <h3 class="card-titulo">${seguro(c.nome)}</h3>
                    <p class="texto-suave">Criada por ${seguro(c.criadaPor || 'Equipe Peak')}</p>
                    <p class="card-texto">${seguro(c.descricao)}</p>
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
    confirmar('Excluir esta campanha oficial? Os monstros dela são apagados junto.', function(){
        enviar('/admin/campanhas/excluir', {id: id}, function(dados){

            if(dados.hasOwnProperty('error')){
                avisar('Não deu certo', dados.error, 'erro')
                return
            }

            carregarCampanhas()
        })
    }, 'Excluir')
}


// =====================================================
// RAÇAS OFICIAIS
// =====================================================

// Da lista de raças, ficam só as oficiais (usuarioId vazio)
function carregarRacas(){
    buscar('/racas', function(lista){
        racas = []

        for(var i = 0; i < lista.length; i++){
            if(lista[i].usuarioId == null){
                racas.push(lista[i])
            }
        }

        desenharRacas()
    })
}

// Uma linha da tabela para cada raça, em <tbody id="tabelaRacas">
function desenharRacas(){
    var html = ''

    for(var i = 0; i < racas.length; i++){
        var r = racas[i]

        html += `
            <tr>
                <td>${r.imagem ? '<img class="miniatura" src="' + seguro(r.imagem) + '" alt="">' : ''}</td>
                <td><strong>${seguro(r.nome)}</strong></td>
                <td>${r.vidaMaxima}</td>
                <td>
                    <div class="botoes">
                        <button type="button" class="botao-icone editar" title="Editar" aria-label="Editar" onclick="editarRaca(${r.id})"></button>
                        <button type="button" class="botao-icone excluir" title="Excluir" aria-label="Excluir" onclick="excluirRaca(${r.id})"></button>
                    </div>
                </td>
            </tr>`
    }

    if(html == ''){
        html = '<tr><td colspan="4" class="texto-suave">Nenhuma raça oficial ainda.</td></tr>'
    }

    document.getElementById('tabelaRacas').innerHTML = html
}

// Abre a janela vazia, para criar
function novaRaca(){
    racaEditando = null

    document.getElementById('tituloRaca').textContent = 'Nova raça oficial'
    document.getElementById('racaNome').value = ''
    document.getElementById('racaDescricao').value = ''
    document.getElementById('racaVida').value = 8
    document.getElementById('racaImagem').value = ''
    document.getElementById('alertRaca').textContent = ''

    abrirJanela('janelaRaca')
}

// Abre a janela preenchida com a raça clicada, para editar
function editarRaca(id){
    racaEditando = id

    for(var i = 0; i < racas.length; i++){
        if(racas[i].id == id){
            var r = racas[i]

            document.getElementById('tituloRaca').textContent = 'Editar ' + r.nome
            document.getElementById('racaNome').value = r.nome
            document.getElementById('racaDescricao').value = r.descricao
            document.getElementById('racaVida').value = r.vidaMaxima
        }
    }

    document.getElementById('racaImagem').value = ''
    document.getElementById('alertRaca').textContent = ''

    abrirJanela('janelaRaca')
}

// O mesmo botão Salvar cria (racaEditando == null) ou edita
function salvarRaca(){
    lerImagem(document.getElementById('racaImagem'), function(imagem){

        var raca = {
            nome: document.getElementById('racaNome').value.trim(),
            descricao: document.getElementById('racaDescricao').value.trim(),
            vidaMaxima: document.getElementById('racaVida').value,
            imagem: imagem
        }

        var rota = '/admin/racas/criar'

        if(racaEditando != null){
            rota = '/admin/racas/atualizar'
            raca.id = racaEditando
        }

        enviar(rota, raca, function(dados){

            if(dados.hasOwnProperty('error')){
                document.getElementById('alertRaca').textContent = dados.error
                return
            }

            fecharJanela('janelaRaca')
            carregarRacas()
        })
    })
}

function excluirRaca(id){
    confirmar('Excluir esta raça oficial?', function(){
        enviar('/admin/racas/excluir', {id: id}, function(dados){

            if(dados.hasOwnProperty('error')){
                avisar('Não deu certo', dados.error, 'erro')
                return
            }

            carregarRacas()
        })
    }, 'Excluir')
}


// =====================================================
// CLASSES OFICIAIS
// =====================================================

// Da lista de classes, ficam só as oficiais (usuarioId vazio)
function carregarClasses(){
    buscar('/classes', function(lista){
        classes = []

        for(var i = 0; i < lista.length; i++){
            if(lista[i].usuarioId == null){
                classes.push(lista[i])
            }
        }

        desenharClasses()
    })
}

// Uma linha da tabela para cada classe, em <tbody id="tabelaClasses">
function desenharClasses(){
    var html = ''

    for(var i = 0; i < classes.length; i++){
        var c = classes[i]

        html += `
            <tr>
                <td>${c.imagem ? '<img class="miniatura" src="' + seguro(c.imagem) + '" alt="">' : ''}</td>
                <td><strong>${seguro(c.nome)}</strong></td>
                <td>
                    <div class="botoes">
                        <button type="button" class="botao-icone editar" title="Editar" aria-label="Editar" onclick="editarClasse(${c.id})"></button>
                        <button type="button" class="botao-icone excluir" title="Excluir" aria-label="Excluir" onclick="excluirClasse(${c.id})"></button>
                    </div>
                </td>
            </tr>`
    }

    if(html == ''){
        html = '<tr><td colspan="3" class="texto-suave">Nenhuma classe oficial ainda.</td></tr>'
    }

    document.getElementById('tabelaClasses').innerHTML = html
}

// Abre a janela vazia, para criar
function novaClasse(){
    classeEditando = null

    document.getElementById('tituloClasse').textContent = 'Nova classe oficial'
    document.getElementById('classeNome').value = ''
    document.getElementById('classeDescricao').value = ''
    document.getElementById('classeImagem').value = ''
    document.getElementById('alertClasse').textContent = ''

    abrirJanela('janelaClasse')
}

// Abre a janela preenchida com a classe clicada, para editar
function editarClasse(id){
    classeEditando = id

    for(var i = 0; i < classes.length; i++){
        if(classes[i].id == id){
            var c = classes[i]

            document.getElementById('tituloClasse').textContent = 'Editar ' + c.nome
            document.getElementById('classeNome').value = c.nome
            document.getElementById('classeDescricao').value = c.descricao
        }
    }

    document.getElementById('classeImagem').value = ''
    document.getElementById('alertClasse').textContent = ''

    abrirJanela('janelaClasse')
}

// O mesmo botão Salvar cria (classeEditando == null) ou edita
function salvarClasse(){
    lerImagem(document.getElementById('classeImagem'), function(imagem){

        var classe = {
            nome: document.getElementById('classeNome').value.trim(),
            descricao: document.getElementById('classeDescricao').value.trim(),
            imagem: imagem
        }

        var rota = '/admin/classes/criar'

        if(classeEditando != null){
            rota = '/admin/classes/atualizar'
            classe.id = classeEditando
        }

        enviar(rota, classe, function(dados){

            if(dados.hasOwnProperty('error')){
                document.getElementById('alertClasse').textContent = dados.error
                return
            }

            fecharJanela('janelaClasse')
            carregarClasses()
        })
    })
}

function excluirClasse(id){
    confirmar('Excluir esta classe oficial?', function(){
        enviar('/admin/classes/excluir', {id: id}, function(dados){

            if(dados.hasOwnProperty('error')){
                avisar('Não deu certo', dados.error, 'erro')
                return
            }

            carregarClasses()
        })
    }, 'Excluir')
}


// =====================================================
// AVISOS DA PEAK
// =====================================================
// A rota /avisos manda os 3 mais novos (o mais novo primeiro).

function carregarAvisos(){
    buscar('/avisos', function(avisos){
        var html = ''

        for(var i = 0; i < avisos.length; i++){
            var a = avisos[i]
            var data = new Date(a.criadoEm).toLocaleDateString('pt-BR')

            html += `
                <tr>
                    <td>${data}</td>
                    <td><strong>${seguro(a.titulo)}</strong></td>
                    <td>${seguro(a.texto || '')}</td>
                    <td>
                        <div class="botoes">
                            <button type="button" class="botao-icone excluir" title="Apagar" aria-label="Apagar" onclick="excluirAviso(${a.id})"></button>
                        </div>
                    </td>
                </tr>`
        }

        if(html == ''){
            html = '<tr><td colspan="4" class="texto-suave">Nenhum aviso ainda.</td></tr>'
        }

        document.getElementById('tabelaAvisos').innerHTML = html
    })
}

function publicarAviso(){
    var aviso = {
        titulo: document.getElementById('avisoTituloNovo').value.trim(),
        texto: document.getElementById('avisoTextoNovo').value.trim()
    }

    document.getElementById('alertAviso').textContent = ''

    enviar('/admin/avisos/criar', aviso, function(dados){

        if(dados.hasOwnProperty('error')){
            document.getElementById('alertAviso').textContent = dados.error
            return
        }

        // limpa os campos e desenha a lista de novo
        document.getElementById('avisoTituloNovo').value = ''
        document.getElementById('avisoTextoNovo').value = ''
        carregarAvisos()
    })
}

function excluirAviso(id){
    confirmar('Apagar este aviso?', function(){
        enviar('/admin/avisos/excluir', {id: id}, function(dados){

            if(dados.hasOwnProperty('error')){
                avisar('Não deu certo', dados.error, 'erro')
                return
            }

            carregarAvisos()
        })
    }, 'Apagar')
}
