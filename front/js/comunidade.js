// comunidade.js  (página comunidade.html)
// Mostra as outras pessoas, quantos interesses cada uma tem em comum comigo
// e se a parceria "combina" (a pessoa É algo que eu PROCURO).
//
// O servidor manda três listas simples e a conta é feita aqui, com for e if:
//   pessoas     -> [{id, nomeUsuario, fotoPerfil}, ...]
//   interesses  -> [{usuarioId, nome}, ...]         "a pessoa X gosta de Y"
//   parcerias   -> [{usuarioId, nome, tipo}, ...]   "a pessoa X é (ou procura) Y"

var pessoas = []
var interesses = []
var parcerias = []

var filtroInteresse = ''   // '' = todos | ou o nome de um interesse
var soCombina = false      // true = mostrar só quem combina comigo

if(verificarLogin()){
    carregarPessoas()
    desenharFiltros()
}

// Busca as três listas, uma depois da outra. Quando a última chega, desenha a página.
function carregarPessoas(){
    buscar('/comunidade/pessoas', function(lista){
        pessoas = lista
        carregarInteresses()
    })
}

function carregarInteresses(){
    buscar('/comunidade/interesses', function(lista){
        interesses = lista
        carregarParcerias()
    })
}

function carregarParcerias(){
    buscar('/comunidade/parcerias', function(lista){
        parcerias = lista
        desenharMinhaParceria()
        desenharPessoas()
    })
}


// =====================================================
// CONTAS (tudo com for e if)
// =====================================================

// Os nomes dos interesses de uma pessoa. Ex.: ['RPG', 'Anime']
function interessesDe(usuarioId){
    var nomes = []

    for(var i = 0; i < interesses.length; i++){
        if(interesses[i].usuarioId == usuarioId){
            nomes.push(interesses[i].nome)
        }
    }

    return nomes
}

// Os nomes das parcerias de uma pessoa. tipo: 'sou' ou 'procuro'
function parceriasDe(usuarioId, tipo){
    var nomes = []

    for(var i = 0; i < parcerias.length; i++){
        if(parcerias[i].usuarioId == usuarioId && parcerias[i].tipo == tipo){
            nomes.push(parcerias[i].nome)
        }
    }

    return nomes
}

// Quantos itens da lista A também estão na lista B
function quantosEmComum(listaA, listaB){
    var total = 0

    for(var i = 0; i < listaA.length; i++){
        if(listaB.indexOf(listaA[i]) != -1){
            total = total + 1
        }
    }

    return total
}


// =====================================================
// FILTROS
// =====================================================

// Cria em <div id="filtroInteresses"> um botão "Todos" e um para cada interesse
function desenharFiltros(){
    buscar('/interesses', function(lista){
        var html = '<button type="button" class="chip chip-botao ' + (filtroInteresse == '' ? 'ativo' : '') + '" onclick="filtrarInteresse(\'\')">Todos</button>'

        for(var i = 0; i < lista.length; i++){
            var nome = lista[i].nome

            html += '<button type="button" class="chip chip-botao ' + (filtroInteresse == nome ? 'ativo' : '') + '" onclick="filtrarInteresse(\'' + seguro(nome) + '\')">' + seguro(nome) + '</button>'
        }

        document.getElementById('filtroInteresses').innerHTML = html
    })
}

function filtrarInteresse(nome){
    filtroInteresse = nome
    desenharFiltros()
    desenharPessoas()
}

function filtrarCombina(valor){
    soCombina = valor

    document.getElementById('filtroTodoMundo').classList.toggle('ativo', valor == false)
    document.getElementById('filtroSoCombina').classList.toggle('ativo', valor == true)

    desenharPessoas()
}


// =====================================================
// A MINHA PARCERIA (coluna da direita)
// =====================================================

// Escreve o que eu sou em <div id="meuSou"> e o que eu procuro em <div id="meuProcuro">
function desenharMinhaParceria(){
    var eu = pegarUsuarioLogado()
    var sou = parceriasDe(eu.id, 'sou')
    var procuro = parceriasDe(eu.id, 'procuro')
    var htmlSou = ''
    var htmlProcuro = ''

    for(var i = 0; i < sou.length; i++){
        htmlSou += '<span class="chip">' + seguro(sou[i]) + '</span>'
    }

    for(var i = 0; i < procuro.length; i++){
        htmlProcuro += '<span class="chip">' + seguro(procuro[i]) + '</span>'
    }

    document.getElementById('meuSou').innerHTML = htmlSou || '<span class="texto-suave">Nada marcado ainda.</span>'
    document.getElementById('meuProcuro').innerHTML = htmlProcuro || '<span class="texto-suave">Nada marcado ainda.</span>'
}


// =====================================================
// AS PESSOAS
// =====================================================

// O card de uma pessoa (clicar abre o perfil dela)
function htmlPessoa(pessoa, emComum, combina){
    var gostos = interessesDe(pessoa.id)
    var sou = parceriasDe(pessoa.id, 'sou')
    var procura = parceriasDe(pessoa.id, 'procuro')
    var chips = ''
    var linha = ''

    for(var i = 0; i < gostos.length; i++){
        chips += '<span class="chip">' + seguro(gostos[i]) + '</span> '
    }

    // "é Ilustrador, Mestre · procura Jogador"
    if(sou.length > 0){
        linha = 'é ' + sou.join(', ')
    }

    if(procura.length > 0){
        linha += (linha == '' ? '' : ' · ') + 'procura ' + procura.join(', ')
    }

    return `
        <a class="pessoa-card" href="perfil.html?id=${pessoa.id}">
            ${htmlFoto(pessoa.fotoPerfil, pessoa.nomeUsuario)}
            <span class="em-comum">${emComum} em comum</span>
            ${combina ? '<span class="selo-combina">Combina</span>' : ''}
            <div class="info">
                <h3>${seguro(pessoa.nomeUsuario)}</h3>
                <small>${seguro(linha)}</small>
                <div>${chips}</div>
            </div>
        </a>`
}

// Desenha as pessoas em <div id="listaPessoas">.
// Quem combina aparece primeiro; depois vêm os outros.
function desenharPessoas(){
    var eu = pegarUsuarioLogado()
    var busca = document.getElementById('busca').value.trim().toLowerCase()

    var meusInteresses = interessesDe(eu.id)
    var oQueProcuro = parceriasDe(eu.id, 'procuro')

    var htmlCombinam = ''
    var htmlOutros = ''
    var totalCombinam = 0

    for(var i = 0; i < pessoas.length; i++){
        var p = pessoas[i]

        // eu não apareço na minha própria lista
        if(p.id == eu.id){
            continue
        }

        // quantos interesses em comum, e se a pessoa É algo que eu PROCURO
        var emComum = quantosEmComum(meusInteresses, interessesDe(p.id))
        var combina = quantosEmComum(oQueProcuro, parceriasDe(p.id, 'sou')) > 0

        if(combina){
            totalCombinam = totalCombinam + 1
        }

        // filtros
        if(busca != '' && p.nomeUsuario.toLowerCase().indexOf(busca) == -1){
            continue
        }

        if(filtroInteresse != '' && interessesDe(p.id).indexOf(filtroInteresse) == -1){
            continue
        }

        if(soCombina && !combina){
            continue
        }

        if(combina){
            htmlCombinam += htmlPessoa(p, emComum, true)
        }else{
            htmlOutros += htmlPessoa(p, emComum, false)
        }
    }

    var html = htmlCombinam + htmlOutros

    if(html == ''){
        html = '<p class="texto-suave">Ninguém encontrado com esse filtro.</p>'
    }

    document.getElementById('listaPessoas').innerHTML = html

    if(totalCombinam == 1){
        document.getElementById('contagemCombina').innerHTML = '<b>1</b> combina com você'
    }else{
        document.getElementById('contagemCombina').innerHTML = '<b>' + totalCombinam + '</b> combinam com você'
    }
}
