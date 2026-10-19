// campanha.js  (página campanha.html?id=3)
// Uma campanha aberta. Tem quatro abas: Mesa, História, Sessões e Painel do Mestre.
// O Mestre vê tudo; o jogador não vê o Painel do Mestre nem os formulários.

// o id da campanha vem do endereço: campanha.html?id=3
var campanhaId = parametro('id')
var campanha = null      // os dados que vieram do servidor
var souMestre = false

if(verificarLogin()){
    carregarCampanha()
}

// Busca a campanha e preenche a capa. Depois chama as outras listas.
// Escreve em: <img id="campanhaCapa">, <b id="campanhaNome">, <small id="campanhaInfo">,
// <p id="campanhaDescricao">, <span id="campanhaPapel">, <p id="campanhaHistoria">...
function carregarCampanha(){
    buscar('/campanha?id=' + campanhaId, function(dados){

        if(dados.hasOwnProperty('error')){
            alert(dados.error)
            window.location.href = 'campanhas.html'
            return
        }

        campanha = dados
        souMestre = (campanha.usuarioMestreId == pegarUsuarioLogado().id)

        document.getElementById('campanhaNome').textContent = campanha.nome
        document.getElementById('campanhaDescricao').textContent = campanha.descricao
        document.getElementById('campanhaHistoria').textContent = campanha.historia || 'O Mestre ainda não escreveu a história desta campanha.'
        document.getElementById('campanhaCriadaPor').textContent = campanha.criadaPor ? 'História de ' + campanha.criadaPor : ''

        if(campanha.imagemCapa){
            document.getElementById('campanhaCapa').src = campanha.imagemCapa
        }

        if(souMestre){
            document.getElementById('campanhaPapel').textContent = 'Mestre'
            document.getElementById('campanhaInfo').textContent = 'você é o mestre · código ' + campanha.codigoConvite

            // mostra tudo o que é só do Mestre (os elementos com a classe "so-mestre")
            var doMestre = document.querySelectorAll('.so-mestre')

            for(var i = 0; i < doMestre.length; i++){
                doMestre[i].classList.remove('oculto')
            }

            // preenche o Painel do Mestre
            document.getElementById('campanhaCodigo').textContent = campanha.codigoConvite
            document.getElementById('edicaoDescricao').value = campanha.descricao
            document.getElementById('edicaoHistoria').value = campanha.historia
            document.getElementById('linkMapa').href = 'mapa.html?id=' + campanha.id

            carregarMonstros()
            carregarOpcoesDeMonstros()
        }else{
            document.getElementById('campanhaPapel').textContent = 'Jogando'
            document.getElementById('campanhaInfo').textContent = 'mestre: ' + campanha.mestre

            var doJogador = document.querySelectorAll('.so-jogador')

            for(var i = 0; i < doJogador.length; i++){
                doJogador[i].classList.remove('oculto')
            }
        }

        carregarJogadores()
        carregarSessoes()
    })
}

// ABAS: mostra <section id="abaMesa">, "abaHistoria", "abaSessoes" ou "abaMestre"
// e esconde as outras. nome: 'Mesa', 'Historia', 'Sessoes' ou 'Mestre'
function mostrarAba(nome){
    var abas = ['Mesa', 'Historia', 'Sessoes', 'Mestre']

    for(var i = 0; i < abas.length; i++){
        document.getElementById('aba' + abas[i]).classList.toggle('oculto', abas[i] != nome)
        document.getElementById('botaoAba' + abas[i]).classList.toggle('ativo', abas[i] == nome)
    }
}


// =====================================================
// ABA MESA: os jogadores
// =====================================================

// Uma carta para cada personagem do grupo, em <div id="listaGrupo">
function carregarJogadores(){
    buscar('/campanha/jogadores?id=' + campanhaId, function(jogadores){
        var html = ''

        for(var i = 0; i < jogadores.length; i++){
            // em cima da carta aparece de quem é o personagem
            html += htmlCarta(jogadores[i], '<span class="selo selo-escuro">' + seguro(jogadores[i].jogador) + '</span>')
        }

        if(html == ''){
            html = '<p class="texto-suave">Ninguém entrou ainda. Passe o código de convite para os seus amigos.</p>'
        }

        document.getElementById('listaGrupo').innerHTML = html
    })
}

function sairDaCampanha(){
    if(!confirm('Sair desta campanha?')){
        return
    }

    enviar('/campanhas/sair', {campanhaId: campanhaId}, function(dados){
        window.location.href = 'campanhas.html'
    })
}


// =====================================================
// ABA SESSÕES
// =====================================================

// Lista as sessões em <div id="listaSessoes">. O botão Excluir só aparece para o Mestre.
function carregarSessoes(){
    buscar('/sessoes?campanhaId=' + campanhaId, function(sessoes){
        var html = ''

        for(var i = 0; i < sessoes.length; i++){
            var s = sessoes[i]
            var botao = ''

            if(souMestre){
                botao = '<button type="button" class="botao botao-pequeno" onclick="excluirSessao(' + s.id + ')">Excluir</button>'
            }

            html += `
                <div class="card sessao">
                    <div class="sessao-topo">
                        <h3>${seguro(s.nome)}</h3>
                        <span class="selo selo-escuro">${formatarData(s.data)}</span>
                    </div>
                    <p>${seguro(s.descricao)}</p>
                    ${s.resultado ? '<p class="texto-suave"><b>Resultado:</b> ' + seguro(s.resultado) + '</p>' : ''}
                    ${botao}
                </div>`
        }

        if(html == ''){
            html = '<p class="texto-suave">Nenhuma sessão registrada ainda.</p>'
        }

        document.getElementById('listaSessoes').innerHTML = html
    })
}

function salvarSessao(){
    var sessao = {
        campanhaId: campanhaId,
        nome: document.getElementById('sessaoNome').value.trim(),
        data: document.getElementById('sessaoData').value,
        descricao: document.getElementById('sessaoDescricao').value.trim(),
        resultado: document.getElementById('sessaoResultado').value.trim()
    }

    enviar('/sessoes/criar', sessao, function(dados){

        if(dados.hasOwnProperty('error')){
            document.getElementById('alertSessao').textContent = dados.error
            return
        }

        document.getElementById('sessaoNome').value = ''
        document.getElementById('sessaoData').value = ''
        document.getElementById('sessaoDescricao').value = ''
        document.getElementById('sessaoResultado').value = ''
        document.getElementById('alertSessao').textContent = ''
        carregarSessoes()
    })
}

function excluirSessao(id){
    if(!confirm('Excluir esta sessão?')){
        return
    }

    enviar('/sessoes/excluir', {id: id}, function(dados){

        if(dados.hasOwnProperty('error')){
            alert(dados.error)
            return
        }

        carregarSessoes()
    })
}


// =====================================================
// ABA PAINEL DO MESTRE
// =====================================================

// Os monstros que já estão na campanha, em <div id="listaMonstros">
function carregarMonstros(){
    buscar('/campanha/monstros?id=' + campanhaId, function(monstros){
        var html = ''

        for(var i = 0; i < monstros.length; i++){
            var m = monstros[i]

            // VISUAL: cada monstro é um quadrinho com foto, e o "×" no canto remove
            html += `
                <div class="monstro-item">
                    ${htmlFoto(m.imagem, m.nome)}
                    <div>
                        <strong>${seguro(m.nome)}</strong>
                        <small>Vida ${m.vidaMaxima} · Defesa ${m.defesa}</small>
                    </div>
                    <button type="button" class="remover-x" onclick="removerMonstro(${m.linhaId})" title="Remover">×</button>
                </div>`
        }

        if(html == ''){
            html = '<p class="texto-suave">Nenhum monstro escolhido ainda.</p>'
        }

        document.getElementById('listaMonstros').innerHTML = html
        document.getElementById('contagemMonstros').textContent = monstros.length
    })
}

// As opções do <select id="monstro">: todos os monstros que eu posso usar, MENOS os que
// são de OUTRA campanha oficial. Se a minha campanha veio de uma oficial (campanha.oficialId),
// os monstros daquela história aparecem.
function carregarOpcoesDeMonstros(){
    buscar('/monstros', function(monstros){
        var html = ''

        for(var i = 0; i < monstros.length; i++){
            var m = monstros[i]

            if(m.campanhaOficialId != null && m.campanhaOficialId != campanha.oficialId){
                continue
            }

            html += '<option value="' + m.id + '">' + seguro(m.nome) + '</option>'
        }

        document.getElementById('monstro').innerHTML = html
    })
}

function adicionarMonstro(){
    var dados = {
        campanhaId: campanhaId,
        monstroId: document.getElementById('monstro').value
    }

    enviar('/campanhas/monstros/adicionar', dados, function(resposta){

        if(resposta.hasOwnProperty('error')){
            alert(resposta.error)
            return
        }

        carregarMonstros()
    })
}

// linhaId: o id da linha na tabela campanha_monstros (veio junto com a lista)
function removerMonstro(linhaId){
    enviar('/campanhas/monstros/remover', {linhaId: linhaId}, function(dados){

        if(dados.hasOwnProperty('error')){
            alert(dados.error)
            return
        }

        carregarMonstros()
    })
}

// Editar: só o resumo e a história
function salvarCampanha(){
    var mudancas = {
        id: campanhaId,
        descricao: document.getElementById('edicaoDescricao').value.trim(),
        historia: document.getElementById('edicaoHistoria').value.trim()
    }

    enviar('/campanhas/atualizar', mudancas, function(dados){

        if(dados.hasOwnProperty('error')){
            alert(dados.error)
            return
        }

        alert(dados.message)
        carregarCampanha()
    })
}

function excluirCampanha(){
    if(!confirm('Excluir esta campanha? Não dá para desfazer.')){
        return
    }

    enviar('/campanhas/excluir', {id: campanhaId}, function(dados){

        if(dados.hasOwnProperty('error')){
            alert(dados.error)
            return
        }

        window.location.href = 'campanhas.html'
    })
}
