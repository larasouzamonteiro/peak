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

    // o "sobre mim" some na aba Configurações
    document.querySelector('.perfil-sobre').classList.toggle('oculto', nome == 'Configuracoes')
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
            avisar('Não deu certo', pessoa.error, 'erro', function(){
                window.location.href = 'comunidade.html'
            })
            return
        }

        document.getElementById('perfilNome').textContent = pessoa.nomeUsuario
        document.getElementById('perfilArroba').textContent = '@' + pessoa.nomeUsuario
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
        // VISUAL: os interesses numa linha só, separados por " | " (ex.: RPG | D&D | Anime)
        var nomes = []

        for(var i = 0; i < lista.length; i++){
            nomes.push(seguro(lista[i].nome))
        }

        document.getElementById('perfilInteresses').innerHTML = nomes.join(' <i>|</i> ') || 'Nenhum interesse marcado.'

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

// VISUAL: cada ficha vira uma LINHA (foto | nome e dados | atributos e vida)
// em <div id="perfilFichas">. O retrato da ÚLTIMA ficha criada aparece no "sobre mim".
function carregarFichas(){
    buscar('/usuario/fichas?id=' + perfilId, function(fichas){
        var html = ''

        for(var i = 0; i < fichas.length; i++){
            var f = fichas[i]

            html += `
                <a class="perfil-linha" href="ficha.html?id=${f.id}">
                    <div class="perfil-linha-foto">${htmlFoto(f.retrato, f.nome)}</div>
                    <div class="perfil-linha-dados">
                        <b>${seguro(f.nome)}</b>
                        <span><small>Raça</small>${seguro(f.raca)}</span>
                        <span><small>Classe</small>${seguro(f.classe)}</span>
                        <span><small>Nível</small>${f.nivel}</span>
                    </div>
                    <div class="perfil-linha-dados">
                        <b>Atributos</b>
                        <span><small>FOR ${f.forca} · DES ${f.destreza} · CON ${f.constituicao}</small></span>
                        <span><small>INT ${f.inteligencia} · SAB ${f.sabedoria} · CAR ${f.carisma}</small></span>
                        <span><small>Vida</small>${f.vidaAtual} / ${f.vidaMaxima}</span>
                    </div>
                </a>`
        }

        document.getElementById('perfilFichas').innerHTML = html || '<p class="texto-suave">Nenhum personagem ainda.</p>'
        document.getElementById('numFichas').textContent = fichas.length

        // a imagem do lado do "sobre mim": o retrato da última ficha que a pessoa fez
        // (as fichas vêm em ordem de id, então a última da lista é a mais nova)
        var ultima = fichas[fichas.length - 1]

        if(fichas.length > 0 && ultima.retrato){
            document.getElementById('perfilSobreImagem').src = ultima.retrato
            document.getElementById('perfilSobreImagem').classList.remove('oculto')
        }
    })
}

// VISUAL: cada campanha vira uma LINHA em <div id="perfilCampanhas">
function carregarCampanhas(){
    buscar('/usuario/campanhas?id=' + perfilId, function(campanhas){
        var html = ''

        for(var i = 0; i < campanhas.length; i++){
            var c = campanhas[i]
            var mestre = (c.usuarioMestreId == perfilId)

            html += `
                <div class="perfil-linha">
                    <div class="perfil-linha-foto">${htmlFoto(c.imagemCapa, c.nome)}</div>
                    <div class="perfil-linha-dados">
                        <b>${seguro(c.nome)}</b>
                        <span><small>Papel</small>${mestre ? 'Mestre' : 'Jogador'}</span>
                        <span><small>Mestre</small>${seguro(c.mestre)}</span>
                    </div>
                    <div class="perfil-linha-dados perfil-linha-texto">
                        <b>Resumo</b>
                        <p>${seguro(c.descricao || 'Sem resumo.')}</p>
                    </div>
                </div>`
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

        // a foto redonda e o nome embaixo; sem foto, aparece a primeira letra do nome
        var html = ''

        for(var i = 0; i < companheiros.length; i++){
            var c = companheiros[i]
            var foto = seguro(String(c.nomeUsuario).charAt(0).toUpperCase())

            if(c.fotoPerfil){
                foto = '<img src="' + seguro(c.fotoPerfil) + '" alt="">'
            }

            html += `
                <a class="companheiro" href="perfil.html?id=${c.id}" title="${seguro(c.nomeUsuario)}">
                    <span class="companheiro-foto">${foto}</span>
                    <span class="companheiro-nome">${seguro(c.nomeUsuario)}</span>
                </a>`
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
