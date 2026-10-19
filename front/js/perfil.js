// perfil.js  (página perfil.html  ou  perfil.html?id=3)
// Mostra o perfil de uma pessoa: sobre mim, contato, interesses, parcerias,
// personagens e campanhas. No MEU perfil aparece também a aba Configurações.

var eu = pegarUsuarioLogado()

// perfil.html      -> o meu perfil
// perfil.html?id=3 -> o perfil da pessoa 3
var perfilId = parametro('id')

if(perfilId == null && eu != null){
    perfilId = eu.id
}

var meuPerfil = (eu != null && perfilId == eu.id)

if(verificarLogin()){
    carregarPessoa()
    carregarInteresses()
    carregarParcerias()
    carregarFichas()
    carregarCampanhas()

    if(meuPerfil){
        // mostra o que é só do dono do perfil (os elementos com a classe "so-meu")
        var soMeu = document.querySelectorAll('.so-meu')

        for(var i = 0; i < soMeu.length; i++){
            soMeu[i].classList.remove('oculto')
        }

        // o link "Configurações" do menu abre perfil.html?aba=configuracoes
        if(parametro('aba') == 'configuracoes'){
            mostrarAba('Configuracoes')
        }
    }
}

// VISUAL: botões Claro / Escuro da aba Configurações.
// Troca o tema (mudarTema do script.js) e marca o botão escolhido com a classe "ativo".
function escolherTema(tema){
    mudarTema(tema)
    document.getElementById('temaClaro').classList.toggle('ativo', tema != 'escuro')
    document.getElementById('temaEscuro').classList.toggle('ativo', tema == 'escuro')
}

// ao abrir a página, marca o botão do tema que já está salvo
if(meuPerfil){
    escolherTema(localStorage.getItem('tema') || 'claro')
}

// ABAS: mostra <div id="abaPersonagens">, "abaCampanhas" ou "abaConfiguracoes" e esconde as outras
function mostrarAba(nome){
    var abas = ['Personagens', 'Campanhas', 'Configuracoes']

    for(var i = 0; i < abas.length; i++){
        document.getElementById('aba' + abas[i]).classList.toggle('oculto', abas[i] != nome)
        document.getElementById('botaoAba' + abas[i]).classList.toggle('ativo', abas[i] == nome)
    }
}


// =====================================================
// COLUNA DA ESQUERDA
// =====================================================

// Nome, foto, capa, "sobre mim" e contato.
// Escreve em: <h1 id="perfilNome">, <div id="perfilFoto">, <img id="perfilCapa">,
//             <p id="perfilBio"> e <p id="perfilContato">
function carregarPessoa(){
    buscar('/usuario?id=' + perfilId, function(pessoa){

        if(pessoa.hasOwnProperty('error')){
            alert(pessoa.error)
            window.location.href = 'comunidade.html'
            return
        }

        document.getElementById('perfilNome').textContent = pessoa.nomeUsuario
        document.getElementById('perfilBio').textContent = pessoa.bio || 'Ainda não escreveu nada.'
        document.getElementById('perfilContato').textContent = pessoa.contato || 'Não informou um contato.'

        // foto: a imagem, ou um quadro com a primeira letra do nome
        document.getElementById('perfilFoto').innerHTML = htmlFoto(pessoa.fotoPerfil, pessoa.nomeUsuario)

        if(pessoa.capaPerfil){
            document.getElementById('perfilCapa').src = pessoa.capaPerfil
            document.getElementById('perfilCapa').classList.remove('oculto')
        }

        // no meu perfil, o formulário das Configurações já vem preenchido
        if(meuPerfil){
            document.getElementById('bio').value = pessoa.bio
            document.getElementById('contato').value = pessoa.contato
        }
    })
}

// Os interesses da pessoa viram chips em <div id="perfilInteresses">
function carregarInteresses(){
    buscar('/usuario/interesses?id=' + perfilId, function(lista){
        var html = ''

        for(var i = 0; i < lista.length; i++){
            html += '<span class="chip">' + seguro(lista[i].nome) + '</span> '
        }

        document.getElementById('perfilInteresses').innerHTML = html || '<span class="texto-suave">Nenhum interesse marcado.</span>'

        // no meu perfil, monta também as caixinhas das Configurações
        if(meuPerfil){
            carregarOpcoesInteresses(lista)
        }
    })
}

// As parcerias da pessoa: as do tipo 'sou' vão para <div id="perfilSou">
// e as do tipo 'procuro' para <div id="perfilProcuro">
function carregarParcerias(){
    buscar('/usuario/parcerias?id=' + perfilId, function(lista){
        var htmlSou = ''
        var htmlProcuro = ''

        for(var i = 0; i < lista.length; i++){
            if(lista[i].tipo == 'sou'){
                htmlSou += '<span class="chip">' + seguro(lista[i].nome) + '</span> '
            }else{
                htmlProcuro += '<span class="chip">' + seguro(lista[i].nome) + '</span> '
            }
        }

        document.getElementById('perfilSou').innerHTML = htmlSou || '<span class="texto-suave">Nada marcado.</span>'
        document.getElementById('perfilProcuro').innerHTML = htmlProcuro || '<span class="texto-suave">Nada marcado.</span>'

        if(meuPerfil){
            carregarOpcoesParcerias(lista)
        }else{
            carregarCombina(lista)
        }
    })
}

// No perfil de OUTRA pessoa: mostra "Combina com você" se ela É algo que eu PROCURO.
// parceriasDela: a lista que acabou de chegar em carregarParcerias()
function carregarCombina(parceriasDela){
    buscar('/usuario/parcerias?id=' + eu.id, function(minhas){
        var combina = false

        for(var i = 0; i < minhas.length; i++){
            for(var j = 0; j < parceriasDela.length; j++){
                if(minhas[i].tipo == 'procuro' && parceriasDela[j].tipo == 'sou' && minhas[i].id == parceriasDela[j].id){
                    combina = true
                }
            }
        }

        if(combina){
            document.getElementById('perfilCombina').classList.remove('oculto')
        }
    })
}


// =====================================================
// ABAS PERSONAGENS E CAMPANHAS
// =====================================================

// As fichas da pessoa viram cartas em <div id="perfilFichas">
function carregarFichas(){
    buscar('/usuario/fichas?id=' + perfilId, function(fichas){
        var html = ''

        for(var i = 0; i < fichas.length; i++){
            html += htmlCarta(fichas[i], '')
        }

        document.getElementById('perfilFichas').innerHTML = html || '<p class="texto-suave">Nenhum personagem ainda.</p>'
    })
}

// As campanhas da pessoa viram cards em <div id="perfilCampanhas">
function carregarCampanhas(){
    buscar('/usuario/campanhas?id=' + perfilId, function(campanhas){
        var html = ''

        for(var i = 0; i < campanhas.length; i++){
            var c = campanhas[i]
            var mestre = (c.usuarioMestreId == perfilId)

            html += `
                <div class="foto-card">
                    ${htmlFoto(c.imagemCapa, c.nome)}
                    <div class="etiquetas"><span class="selo ${mestre ? 'selo-escuro' : ''}">${mestre ? 'Mestre' : 'Jogando'}</span></div>
                    <div class="nome"><b>${seguro(c.nome)}</b><small>mestre: ${seguro(c.mestre)}</small></div>
                </div>`
        }

        document.getElementById('perfilCampanhas').innerHTML = html || '<p class="texto-suave">Nenhuma campanha ainda.</p>'
    })
}


// =====================================================
// ABA CONFIGURAÇÕES (só no meu perfil)
// =====================================================

// ---------- foto e capa ----------
function trocarFoto(){
    lerImagem(document.getElementById('fotoArquivo'), function(imagem){

        if(imagem == ''){
            alert('Escolha uma imagem primeiro.')
            return
        }

        enviar('/perfil/foto', {imagem: imagem}, function(dados){
            alert(dados.message)
            carregarPessoa()
        })
    })
}

function trocarCapa(){
    lerImagem(document.getElementById('capaArquivo'), function(imagem){

        if(imagem == ''){
            alert('Escolha uma imagem primeiro.')
            return
        }

        enviar('/perfil/capa', {imagem: imagem}, function(dados){
            alert(dados.message)
            carregarPessoa()
        })
    })
}

// ---------- sobre mim e contato ----------
function salvarPerfil(){
    var dados = {
        bio: document.getElementById('bio').value.trim(),
        contato: document.getElementById('contato').value.trim()
    }

    enviar('/perfil/atualizar', dados, function(resposta){
        alert(resposta.message)
        carregarPessoa()
    })
}

// ---------- interesses ----------
// Uma caixinha para cada interesse que existe, em <div id="opcoesInteresses">.
// meus: os interesses que eu já tenho (essas caixinhas já vêm marcadas)
function carregarOpcoesInteresses(meus){
    buscar('/interesses', function(todos){
        var html = ''

        for(var i = 0; i < todos.length; i++){
            var marcado = false

            for(var j = 0; j < meus.length; j++){
                if(meus[j].id == todos[i].id){
                    marcado = true
                }
            }

            html += `
                <label class="chip">
                    <input type="checkbox" ${marcado ? 'checked' : ''} onchange="marcarInteresse(this, ${todos[i].id})">
                    ${seguro(todos[i].nome)}
                </label>`
        }

        document.getElementById('opcoesInteresses').innerHTML = html
    })
}

// caixinha: o <input type="checkbox"> que foi clicado. Marcou = adiciona; desmarcou = remove.
function marcarInteresse(caixinha, interesseId){
    var rota = '/perfil/interesses/remover'

    if(caixinha.checked){
        rota = '/perfil/interesses/adicionar'
    }

    enviar(rota, {interesseId: interesseId}, function(dados){
        carregarInteresses()
    })
}

// ---------- parcerias ----------
// Duas fileiras de caixinhas com as mesmas parcerias:
//   <div id="opcoesSou">     -> o que eu sou
//   <div id="opcoesProcuro"> -> o que eu procuro
function carregarOpcoesParcerias(minhas){
    buscar('/parcerias', function(todas){
        var htmlSou = ''
        var htmlProcuro = ''

        for(var i = 0; i < todas.length; i++){
            var sou = false
            var procuro = false

            for(var j = 0; j < minhas.length; j++){
                if(minhas[j].id == todas[i].id && minhas[j].tipo == 'sou'){
                    sou = true
                }

                if(minhas[j].id == todas[i].id && minhas[j].tipo == 'procuro'){
                    procuro = true
                }
            }

            htmlSou += `
                <label class="chip">
                    <input type="checkbox" ${sou ? 'checked' : ''} onchange="marcarParceria(this, ${todas[i].id}, 'sou')">
                    ${seguro(todas[i].nome)}
                </label>`

            htmlProcuro += `
                <label class="chip">
                    <input type="checkbox" ${procuro ? 'checked' : ''} onchange="marcarParceria(this, ${todas[i].id}, 'procuro')">
                    ${seguro(todas[i].nome)}
                </label>`
        }

        document.getElementById('opcoesSou').innerHTML = htmlSou
        document.getElementById('opcoesProcuro').innerHTML = htmlProcuro
    })
}

// tipo: 'sou' ou 'procuro'
function marcarParceria(caixinha, parceriaId, tipo){
    var rota = '/perfil/parcerias/remover'

    if(caixinha.checked){
        rota = '/perfil/parcerias/adicionar'
    }

    enviar(rota, {parceriaId: parceriaId, tipo: tipo}, function(dados){
        carregarParcerias()
    })
}
