// monstros.js  (página monstros.html, o Bestiário)
// No topo ficam as FAIXAS. Cada faixa mostra um grupo de monstros:
//   Todos       -> todos os monstros que a pessoa pode ver
//   Peak        -> monstros oficiais que servem para qualquer campanha
//   (campanha)  -> monstros oficiais daquela campanha oficial
//   Comunidade  -> monstros que outras pessoas criaram e tornaram públicos
//   Meus        -> os que eu criei

var monstros = []            // todos os monstros que vieram do servidor
var oficiais = []            // as campanhas oficiais (viram faixas)
var faixaEscolhida = 'peak'  // 'todos', 'peak', 'comunidade', 'meus' ou o ID de uma campanha oficial
var monstroAberto = null     // o monstro que está aberto na janela

if(verificarLogin()){
    carregarTudo()
}

// Primeiro as campanhas oficiais (para montar as faixas), depois os monstros
function carregarTudo(){
    buscar('/campanhas/oficiais', function(lista){
        oficiais = lista
        desenharFaixas()
        carregarMonstros()
    })
}

function carregarMonstros(){
    buscar('/monstros', function(lista){
        monstros = lista
        desenharMonstros()
    })
}


// =====================================================
// FAIXAS
// =====================================================

// Um botão de faixa. valor: o que vai para a função escolherFaixa()
function htmlFaixa(valor, nome, imagem){
    var ativa = (valor == faixaEscolhida)

    return `
        <button type="button" class="faixa ${ativa ? 'ativa' : ''}" onclick="escolherFaixa('${valor}')">
            ${imagem ? '<img src="' + seguro(imagem) + '" alt="">' : ''}
            <span>${seguro(nome)}</span>
        </button>`
}

// Cria os botões em <div id="faixas"> e a frase em <p id="faixaInfo">
function desenharFaixas(){
    var html = htmlFaixa('todos', 'Todos', '')
    html += htmlFaixa('peak', 'Peak', '../img/mascote/m3.jpg')
    var frase = 'Monstros oficiais da Peak. Servem para qualquer campanha.'

    if(faixaEscolhida == 'todos'){
        frase = 'Todos os monstros: da Peak, das campanhas, da comunidade e os seus.'
    }

    // uma faixa para cada campanha oficial (a imagem é a capa dela)
    for(var i = 0; i < oficiais.length; i++){
        html += htmlFaixa(oficiais[i].id, oficiais[i].nome, oficiais[i].imagemCapa)

        if(oficiais[i].id == faixaEscolhida){
            frase = 'Conteúdo oficial da campanha ' + oficiais[i].nome + '.'

            if(oficiais[i].criadaPor){
                frase += ' História de ' + oficiais[i].criadaPor + '.'
            }
        }
    }

    html += htmlFaixa('comunidade', 'Comunidade', '../img/racas/fada.jpg')
    html += htmlFaixa('meus', 'Meus', '')

    if(faixaEscolhida == 'comunidade'){
        frase = 'Monstros criados por outros jogadores e marcados como públicos.'
    }

    if(faixaEscolhida == 'meus'){
        frase = 'Os monstros que você criou. Só você pode editar e excluir.'
    }

    document.getElementById('faixas').innerHTML = html
    document.getElementById('faixaInfo').textContent = frase
}

function escolherFaixa(valor){
    faixaEscolhida = valor
    desenharFaixas()
    desenharMonstros()
}

// Diz se o monstro "m" pertence à faixa escolhida
function estaNaFaixa(m){
    var eu = pegarUsuarioLogado()

    if(faixaEscolhida == 'todos'){
        return true      // na faixa Todos, todo monstro serve
    }

    if(faixaEscolhida == 'peak'){
        return m.usuarioId == null && m.campanhaOficialId == null
    }

    if(faixaEscolhida == 'comunidade'){
        // A faixa deve mostrar qualquer monstro de jogador que seja público,
        // inclusive o que a própria pessoa acabou de compartilhar.
        return m.usuarioId != null && m.publico == 1
    }

    if(faixaEscolhida == 'meus'){
        return m.usuarioId == eu.id
    }

    // qualquer outro valor é o id de uma campanha oficial
    return m.campanhaOficialId == faixaEscolhida
}


// =====================================================
// LISTA DE MONSTROS
// =====================================================

// Desenha em <div id="listaMonstros"> os monstros da faixa escolhida.
// Igual à Comunidade: cada filtro tira quem não serve.
//   1. a faixa (estaNaFaixa)
//   2. a busca: se a pessoa digitou algo em <input id="busca">, só os que têm aquele texto no nome
function desenharMonstros(){
    var busca = document.getElementById('busca').value.trim().toLowerCase()
    var html = ''

    for(var i = 0; i < monstros.length; i++){
        var m = monstros[i]

        if(!estaNaFaixa(m)){
            continue
        }

        if(busca != '' && m.nome.toLowerCase().indexOf(busca) == -1){
            continue
        }

        // a linha pequena embaixo do nome: de onde o monstro é
        var origem = 'Peak'

        if(m.campanhaOficial){
            origem = m.campanhaOficial
        }else if(m.autor){
            origem = 'por ' + m.autor
        }

        html += `
            <button type="button" class="foto-card" onclick="abrirMonstro(${m.id})">
                ${htmlFoto(m.imagem, m.nome)}
                <div class="etiquetas">
                    <span class="selo">♥ ${m.vidaMaxima}</span>
                    <span class="selo selo-escuro">DEF ${m.defesa}</span>
                </div>
                <div class="nome"><b>${seguro(m.nome)}</b><small>${seguro(origem)}</small></div>
            </button>`
    }

    // na faixa Meus (sem busca), o último quadro é o "Criar monstro"
    if(faixaEscolhida == 'meus' && busca == ''){
        html += `
            <button type="button" class="card-novo" onclick="abrirJanela('janelaNovo')">
                <img src="../img/icones/mais.svg" alt="">
                Criar monstro
            </button>`
    }else if(html == '' && busca != ''){
        html = '<p class="texto-suave">Nenhum monstro com esse nome nesta faixa.</p>'
    }else if(html == ''){
        html = '<p class="texto-suave">Nenhum monstro aqui ainda.</p>'
    }

    document.getElementById('listaMonstros').innerHTML = html
}


// =====================================================
// JANELA DE UM MONSTRO
// =====================================================

// Preenche a janela <div id="janelaMonstro"> com o monstro clicado e abre
function abrirMonstro(id){
    for(var i = 0; i < monstros.length; i++){
        if(monstros[i].id == id){
            monstroAberto = monstros[i]
        }
    }

    var m = monstroAberto
    var eu = pegarUsuarioLogado()

    document.getElementById('monstroNome').textContent = m.nome
    document.getElementById('monstroVida').textContent = '♥ Vida ' + m.vidaMaxima
    document.getElementById('monstroDefesa').textContent = 'Defesa ' + m.defesa
    document.getElementById('monstroDescricao').textContent = m.descricao || 'Sem descrição.'

    if(m.campanhaOficial){
        document.getElementById('monstroOrigem').textContent = 'Campanha ' + m.campanhaOficial
    }else if(m.autor){
        document.getElementById('monstroOrigem').textContent = 'Criado por ' + m.autor
    }else{
        document.getElementById('monstroOrigem').textContent = 'Oficial da Peak'
    }

    // sem imagem, a foto da janela fica escondida
    if(m.imagem){
        document.getElementById('monstroImagem').src = m.imagem
        document.getElementById('monstroImagem').classList.remove('oculto')
    }else{
        document.getElementById('monstroImagem').classList.add('oculto')
    }

    // a parte de editar só aparece se o monstro for meu
    if(m.usuarioId == eu.id){
        document.getElementById('descricaoEdicao').value = m.descricao
        document.getElementById('publicoEdicao').checked = (m.publico == 1)
        document.getElementById('areaDono').classList.remove('oculto')
    }else{
        document.getElementById('areaDono').classList.add('oculto')
    }

    abrirJanela('janelaMonstro')
}

// Editar: só a descrição e se é público
function salvarEdicao(){
    var mudancas = {
        id: monstroAberto.id,
        descricao: document.getElementById('descricaoEdicao').value.trim(),
        publico: document.getElementById('publicoEdicao').checked
    }

    enviar('/monstros/atualizar', mudancas, function(dados){

        if(dados.hasOwnProperty('error')){
            alert(dados.error)
            return
        }

        fecharJanela('janelaMonstro')
        carregarMonstros()
    })
}

function excluirMonstro(){
    if(!confirm('Excluir este monstro?')){
        return
    }

    enviar('/monstros/excluir', {id: monstroAberto.id}, function(dados){

        if(dados.hasOwnProperty('error')){
            alert(dados.error)
            return
        }

        fecharJanela('janelaMonstro')
        carregarMonstros()
    })
}


// =====================================================
// CRIAR MONSTRO
// =====================================================

function salvarMonstro(){

    // primeiro lê a imagem escolhida; quando terminar, manda tudo para o servidor
    lerImagem(document.getElementById('imagem'), function(imagem){

        var monstro = {
            nome: document.getElementById('nome').value.trim(),
            imagem: imagem,
            descricao: document.getElementById('descricao').value.trim(),
            vidaMaxima: document.getElementById('vidaMaxima').value,
            defesa: document.getElementById('defesa').value,
            publico: document.getElementById('publico').checked
        }

        enviar('/monstros/criar', monstro, function(dados){

            if(dados.hasOwnProperty('error')){
                document.getElementById('alert').textContent = dados.error
                return
            }

            // limpa o formulário, fecha a janela e mostra a lista de novo
            document.getElementById('nome').value = ''
            document.getElementById('imagem').value = ''
            document.getElementById('descricao').value = ''
            document.getElementById('publico').checked = false
            document.getElementById('alert').textContent = ''

            fecharJanela('janelaNovo')
            carregarMonstros()
        })
    })
}
