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
    carregarCompanheiros()

    if(meuPerfil){
        // mostra o que é só do dono do perfil (os elementos com a classe "so-meu")
        var soMeu = document.querySelectorAll('.so-meu')

        for(var i = 0; i < soMeu.length; i++){
            soMeu[i].classList.remove('oculto')
        }

        marcarTema()

        // o link "Configurações" do menu abre perfil.html?aba=configuracoes
        if(parametro('aba') == 'configuracoes'){
            mostrarAba('Configuracoes')
        }
    }
}

// ABAS: mostra <div id="abaPersonagens">, "abaCampanhas" ou "abaConfiguracoes" e esconde as outras
function mostrarAba(nome){
    var abas = ['Personagens', 'Campanhas', 'Configuracoes']

    for(var i = 0; i < abas.length; i++){
        document.getElementById('aba' + abas[i]).classList.toggle('oculto', abas[i] != nome)
        document.getElementById('botaoAba' + abas[i]).classList.toggle('ativo', abas[i] == nome)
    }

    // na aba Configurações: o "sobre mim" some e aparecem o "Trocar capa" e o lápis da foto
    document.getElementById('perfilSobre').classList.toggle('oculto', nome == 'Configuracoes')
    document.getElementById('paginaPerfil').classList.toggle('editando', nome == 'Configuracoes')
}

// VISUAL: o botão de sol e lua. Troca o tema (mudarTema do script.js) e o botão
// ganha a classe "noite" (a bolinha vai para o outro lado e vira lua; está no perfil.css).
function trocarTema(){
    if(localStorage.getItem('tema') == 'escuro'){
        mudarTema('claro')
    }else{
        mudarTema('escuro')
    }

    marcarTema()
}

function marcarTema(){
    document.getElementById('temaBotao').classList.toggle('noite', localStorage.getItem('tema') == 'escuro')
}

// As setas ‹ › das fileiras: andam a fileira para o lado (lado: -1 = voltar, 1 = avançar)
function rolarFila(id, lado){
    document.getElementById(id).scrollBy({left: lado * 480, behavior: 'smooth'})
}

// COMPARTILHAR: o link do perfil. No celular abre a janela de compartilhar do aparelho
// (WhatsApp, Instagram...). No computador o link é copiado e aparece um aviso.
function compartilharPerfil(){
    var link = window.location.href.split('?')[0] + '?id=' + perfilId

    if(navigator.share){
        navigator.share({title: 'Peak', text: 'Meu perfil na Peak', url: link})
        return
    }

    navigator.clipboard.writeText(link)
    avisar('Link copiado!', 'Agora é só colar onde você quiser.', 'certo')
}

// COPIAR CONTATO: copia o contato da pessoa (o que está escrito na caixa Contato)
var contatoDaPessoa = ''

function copiarContato(){
    if(contatoDaPessoa == ''){
        avisar('Sem contato', 'Essa pessoa ainda não informou um contato.', 'info')
        return
    }

    navigator.clipboard.writeText(contatoDaPessoa)
    avisar('Contato copiado!', contatoDaPessoa, 'certo')
}


// =====================================================
// COLUNA DA ESQUERDA
// =====================================================

// Nome, foto, capa, "sobre mim" (com a imagem) e contato.
// Escreve em: <h1 id="perfilNome">, <div id="perfilFoto">, <img id="perfilCapa">,
//             <p id="perfilBio">, <img id="perfilSobreImagem"> e <span id="perfilContato">
var imagemDasFichas = ''   // o retrato da última ficha (usado quando a pessoa não escolheu imagem)
var imagemEscolhida = ''   // a imagem que a pessoa escolheu para o "sobre mim"
function carregarPessoa(){
    buscar('/usuario?id=' + perfilId, function(pessoa){

        if(pessoa.hasOwnProperty('error')){
            avisar('Não deu certo', pessoa.error, 'erro', function(){
                window.location.href = 'comunidade.html'
            })
            return
        }

        document.getElementById('perfilNome').textContent = pessoa.nomeUsuario
        document.getElementById('perfilArroba').textContent = '@' + pessoa.nomeUsuario
        document.getElementById('perfilBio').textContent = pessoa.bio || 'Ainda não escreveu nada.'
        document.getElementById('perfilContato').textContent = pessoa.contato || 'Não informou um contato.'
        contatoDaPessoa = pessoa.contato || ''

        // a imagem do "sobre mim" (coluna imagemSobre). Sem ela, fica o retrato da última ficha.
        imagemEscolhida = pessoa.imagemSobre || ''
        mostrarImagemSobre()

        // foto: a imagem, ou um quadro com a primeira letra do nome
        document.getElementById('perfilFoto').innerHTML = htmlFoto(pessoa.fotoPerfil, pessoa.nomeUsuario)

        if(pessoa.capaPerfil){
            document.getElementById('perfilCapa').src = pessoa.capaPerfil
            document.getElementById('perfilCapa').classList.remove('oculto')
        }

        // no meu perfil, o formulário das Configurações já vem preenchido
        if(meuPerfil){
            document.getElementById('bio').value = pessoa.bio || ''
            document.getElementById('contato').value = pessoa.contato || ''
        }
    })
}

// Os interesses da pessoa viram chips em <div id="perfilInteresses">
function carregarInteresses(){
    buscar('/usuario/interesses?id=' + perfilId, function(lista){
        // VISUAL: cada interesse vira um selo clarinho embaixo do nome
        var html = ''

        for(var i = 0; i < lista.length; i++){
            html += '<span class="selo-perfil claro">' + seguro(lista[i].nome) + '</span> '
        }

        document.getElementById('perfilInteresses').innerHTML = html

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
            // VISUAL: o que a pessoa É vira selo rosa embaixo do nome; o que ela PROCURA vai para a caixa da esquerda
            if(lista[i].tipo == 'sou'){
                htmlSou += '<span class="selo-perfil">' + seguro(lista[i].nome) + '</span> '
            }else{
                htmlProcuro += '<span class="selo-perfil">' + seguro(lista[i].nome) + '</span> '
            }
        }

        document.getElementById('perfilSou').innerHTML = htmlSou
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

// VISUAL: as fichas viram as mesmas cartas da página Fichas (htmlCarta do script.js),
// numa fileira que desliza para o lado em <div id="perfilFichas">.
// No MEU perfil, a primeira carta é a "Nova ficha" (a da boneca).
function carregarFichas(){
    buscar('/usuario/fichas?id=' + perfilId, function(fichas){
        var html = ''

        if(meuPerfil){
            html += `
                <a class="card-novo" href="criar-ficha.html">
                    <img class="card-novo-foto" src="../img/criar/nova-ficha.jpg" alt="">
                    <span class="card-novo-mais">+</span>
                    <b>Nova ficha</b>
                    <small>criar na Oficina</small>
                </a>`
        }

        for(var i = 0; i < fichas.length; i++){
            html += htmlCarta(fichas[i], '')
        }

        if(html == ''){
            html = '<p class="texto-suave">Nenhum personagem ainda.</p>'
        }

        document.getElementById('perfilFichas').innerHTML = html
        document.getElementById('numFichas').textContent = fichas.length

        // o retrato da última ficha que a pessoa fez (as fichas vêm em ordem de id,
        // então a última da lista é a mais nova). Ele aparece no "sobre mim" quando
        // a pessoa não escolheu uma imagem.
        if(fichas.length > 0){
            imagemDasFichas = fichas[fichas.length - 1].retrato || ''
        }

        mostrarImagemSobre()
    })
}

// A imagem do lado do "sobre mim": a escolhida pela pessoa, senão a da última ficha.
// Sem nenhuma das duas, a imagem some e o texto ocupa o card inteiro (classe "sem-imagem").
function mostrarImagemSobre(){
    var imagem = imagemEscolhida || imagemDasFichas
    var img = document.getElementById('perfilSobreImagem')

    if(imagem){
        img.src = imagem
    }

    img.classList.toggle('oculto', imagem == '')
    document.getElementById('perfilSobre').classList.toggle('sem-imagem', imagem == '')

    // a prévia nas Configurações
    if(meuPerfil){
        document.getElementById('configSobreImagem').src = imagem
        document.getElementById('configSobreImagem').classList.toggle('oculto', imagem == '')
    }
}

// VISUAL: as campanhas viram os mesmos cards da página Campanhas, numa fileira que desliza.
// No MEU perfil o card abre a campanha; no perfil de outra pessoa é só para ver.
function carregarCampanhas(){
    buscar('/usuario/campanhas?id=' + perfilId, function(campanhas){
        var html = ''

        for(var i = 0; i < campanhas.length; i++){
            var c = campanhas[i]
            var mestre = (c.usuarioMestreId == perfilId)
            var tag = 'div'
            var link = ''

            if(meuPerfil){
                tag = 'a'
                link = 'href="campanha.html?id=' + c.id + '"'
            }

            html += `
                <${tag} class="foto-card" ${link}>
                    ${htmlFoto(c.imagemCapa, c.nome)}
                    <div class="etiquetas"><span class="selo ${mestre ? 'selo-escuro' : ''}">${mestre ? 'Mestre' : 'Jogando'}</span></div>
                    <div class="nome">
                        <b>${seguro(c.nome)}</b>
                        <small>${mestre ? 'é o mestre' : 'mestre: ' + seguro(c.mestre)}</small>
                    </div>
                </${tag}>`
        }

        document.getElementById('perfilCampanhas').innerHTML = html || '<p class="texto-suave">Nenhuma campanha ainda.</p>'
        document.getElementById('numCampanhas').textContent = campanhas.length
    })
}


// =====================================================
// COMPANHEIROS DE MESA
// =====================================================
// Não existe tabela de amigos, então usa o que já tem no banco:
// quem é Mestre ou jogador nas mesmas campanhas que a pessoa do perfil.
// O servidor já devolve a lista pronta (/usuario/companheiros), sem ninguém repetido
// e sem a própria pessoa. Assim todo mundo que abre o perfil vê os mesmos amigos.
// Cada companheiro vem com { id, nomeUsuario, fotoPerfil }.
function carregarCompanheiros(){
    buscar('/usuario/companheiros?id=' + perfilId, function(companheiros){
        var lugar = document.getElementById('perfilCompanheiros')

        if(!Array.isArray(companheiros)){
            companheiros = []
        }

        document.getElementById('numCompanheiros').textContent = companheiros.length

        if(companheiros.length == 0){
            lugar.innerHTML = '<p class="texto-suave">Ainda não jogou com ninguém.</p>'
            return
        }

        // VISUAL: as fotos redondas uma em cima da outra (o nome aparece passando o mouse).
        // Mostra até 6; se tiver mais, a última bolinha diz "+3", "+10"...
        var html = ''

        for(var i = 0; i < companheiros.length && i < 6; i++){
            var c = companheiros[i]
            var foto = seguro(String(c.nomeUsuario).charAt(0).toUpperCase())

            if(c.fotoPerfil){
                foto = '<img src="' + seguro(c.fotoPerfil) + '" alt="">'
            }

            html += `
                <a class="companheiro" href="perfil.html?id=${c.id}" title="${seguro(c.nomeUsuario)}">${foto}</a>`
        }

        if(companheiros.length > 6){
            html += '<span class="companheiro mais">+' + (companheiros.length - 6) + '</span>'
        }

        lugar.innerHTML = html
    })
}


// =====================================================
// ABA CONFIGURAÇÕES (só no meu perfil)
// =====================================================

// ---------- foto e capa ----------
function trocarFoto(){
    lerImagem(document.getElementById('fotoArquivo'), function(imagem){

        if(imagem == ''){
            avisar('Falta a imagem', 'Escolha uma imagem primeiro.', 'info')
            return
        }

        enviar('/perfil/foto', {imagem: imagem}, function(dados){
            // arquivo inválido ou erro no servidor: mostra o erro (antes aparecia "undefined")
            if(dados.error){
                avisar('Não deu certo', dados.error, 'erro')
                return
            }

            avisar(dados.message, '', 'certo')
            carregarPessoa()
        })
    })
}

function trocarCapa(){
    lerImagem(document.getElementById('capaArquivo'), function(imagem){

        if(imagem == ''){
            avisar('Falta a imagem', 'Escolha uma imagem primeiro.', 'info')
            return
        }

        enviar('/perfil/capa', {imagem: imagem}, function(dados){
            // arquivo inválido ou erro no servidor: mostra o erro (antes aparecia "undefined")
            if(dados.error){
                avisar('Não deu certo', dados.error, 'erro')
                return
            }

            avisar(dados.message, '', 'certo')
            carregarPessoa()
        })
    })
}

// ---------- imagem do "sobre mim" ----------
// precisa da coluna imagemSobre na tabela usuarios (ALTER TABLE, explicado no LEIA-ME)
function trocarImagemSobre(){
    lerImagem(document.getElementById('sobreArquivo'), function(imagem){

        if(imagem == ''){
            avisar('Falta a imagem', 'Escolha uma imagem primeiro.', 'info')
            return
        }

        enviar('/perfil/sobre-imagem', {imagem: imagem}, function(dados){
            if(dados.error){
                avisar('Não deu certo', dados.error, 'erro')
                return
            }

            avisar(dados.message, '', 'certo')
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
        if(resposta.error){
            avisar('Não deu certo', resposta.error, 'erro')
            return
        }

        avisar(resposta.message, '', 'certo')
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
