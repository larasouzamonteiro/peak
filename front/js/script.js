// script.js
// Funções usadas em VÁRIAS páginas (carregado antes do JavaScript de cada página).
//
// O localStorage guarda:
//   usuarioLogado -> quem está logado (id, nomeUsuario, tipo e tutorialVisto)
//   token         -> código que o servidor deu no login
//
// Regra do projeto: o JavaScript NÃO escreve CSS. Para mudar a aparência ele só
// coloca ou tira uma classe (ex.: 'oculto', 'ativo'), e a classe está nos arquivos .css.

// VERSÃO SERVIDOR: as páginas e o servidor estão no mesmo endereço,
// então o endereço fica vazio ('/login' vai para o próprio site)
var SERVIDOR = ''


// =====================================================
// 1. FALAR COM O SERVIDOR
// =====================================================

// GET: busca dados. Ex.: buscar('/fichas', function(fichas){ ... })
// O token vai no cabeçalho Authorization para o servidor saber quem está pedindo.
function buscar(rota, depois){
    // em que parte o pedido está (explicado em falhaNoPedido, mais abaixo)
    var etapa = 'conexao'

    fetch(SERVIDOR + rota, {
        method: 'GET',
        headers: {
            'Authorization': localStorage.getItem('token') || ''
        }
    })
    .then(function(response){
        etapa = 'resposta'
        return response.json()
    })
    .then(function(dados){
        // token velho ou errado: volta para o login
        if(dados.sair){
            sair()
            return
        }

        etapa = 'pagina'
        depois(dados)
    })
    .catch(function(erro){
        falhaNoPedido(erro, etapa)
    })
}

// POST: manda dados. Ex.: enviar('/fichas/criar', {nome: 'Aria'}, function(dados){ ... })
function enviar(rota, corpo, depois){
    var etapa = 'conexao'

    fetch(SERVIDOR + rota, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'Authorization': localStorage.getItem('token') || ''
        },
        body: JSON.stringify(corpo)
    })
    .then(function(response){
        etapa = 'resposta'
        return response.json()
    })
    .then(function(dados){
        if(dados.sair){
            sair()
            return
        }

        etapa = 'pagina'
        depois(dados)
    })
    .catch(function(erro){
        falhaNoPedido(erro, etapa)
    })
}

// Quando a pessoa troca de página (clicou num link, ou o JS mudou o
// window.location), o navegador cancela os pedidos que ainda não voltaram.
// Isso cai no .catch como se fosse erro, mas não é: então guardamos que a
// página está saindo e não mostramos aviso nenhum nesse caso.
var saindoDaPagina = false

window.addEventListener('beforeunload', function(){
    saindoDaPagina = true
})
window.addEventListener('pagehide', function(){
    saindoDaPagina = true
})
// voltou para a página pela seta "voltar" do navegador: ela vale de novo
window.addEventListener('pageshow', function(){
    saindoDaPagina = false
})

// O que fazer quando um pedido dá erro. A "etapa" diz onde parou:
//   'conexao'  -> nem chegou resposta: aí sim o servidor está fora do ar (ou sem internet)
//   'resposta' -> o servidor respondeu, mas não com JSON (ex.: rota que não existe)
//   'pagina'   -> o servidor respondeu certo; o erro foi no JavaScript da própria página
function falhaNoPedido(erro, etapa){
    if(saindoDaPagina){
        return
    }

    // erro do JavaScript da página: mostra no console (F12) e não culpa o servidor
    if(etapa == 'pagina'){
        console.error(erro)
        return
    }

    if(etapa == 'resposta'){
        console.error(erro)
        alert('O servidor respondeu com um erro. Tente de novo.')
        return
    }

    alert('Não consegui falar com o servidor. Tente de novo em 1 minuto (ele pode estar acordando).')
}


// =====================================================
// 2. QUEM ESTÁ LOGADO
// =====================================================

function pegarUsuarioLogado(){
    var texto = localStorage.getItem('usuarioLogado')

    if(texto == null){
        return null
    }

    return JSON.parse(texto)
}

// Páginas de dentro: se ninguém estiver logado, vai para o login e devolve false.
// Se estiver, preenche o menu com o nome da pessoa e devolve true.
//
// Mexe nestes pedaços do HTML (que são iguais em todas as páginas de dentro):
//   <span id="saudacao">   -> "Bom dia", "Boa tarde" ou "Boa noite"
//   <b id="nomeLogado">    -> o nome, no topo da página
//   <div id="menuLetra">   -> a primeira letra do nome, na bolinha do menu
//   <strong id="menuNome"> -> o nome, embaixo do menu
//   <a id="linkAdmin">     -> o link Administração (só aparece para admin)
function verificarLogin(){
    var usuario = pegarUsuarioLogado()

    if(usuario == null || localStorage.getItem('token') == null){
        window.location.href = 'login.html'
        return false
    }

    var hora = new Date().getHours()
    var saudacao = 'Boa noite'

    if(hora >= 5 && hora < 12){
        saudacao = 'Bom dia'
    }else if(hora >= 12 && hora < 18){
        saudacao = 'Boa tarde'
    }

    document.getElementById('saudacao').textContent = saudacao
    document.getElementById('nomeLogado').textContent = usuario.nomeUsuario
    document.getElementById('menuLetra').textContent = usuario.nomeUsuario.charAt(0).toUpperCase()

    // VISUAL: se a pessoa tem foto de perfil, a foto aparece no menu no lugar da letra
    buscar('/usuario?id=' + usuario.id, function(pessoa){
        if(pessoa.fotoPerfil){
            document.getElementById('menuLetra').innerHTML = '<img src="' + seguro(pessoa.fotoPerfil) + '" alt="">'
        }
    })
    document.getElementById('menuNome').textContent = usuario.nomeUsuario

    if(usuario.tipo == 'admin'){
        document.getElementById('linkAdmin').classList.remove('oculto')
    }

    return true
}

function sair(){
    var token = localStorage.getItem('token')

    localStorage.removeItem('usuarioLogado')
    localStorage.removeItem('token')

    // VERSÃO SERVIDOR: avisa o servidor para apagar o token (ele para de valer na hora)
    fetch(SERVIDOR + '/logout', {method: 'POST', headers: {'Authorization': token || ''}})
    .finally(() => {
        window.location.href = 'login.html'
    })
}


// =====================================================
// 3. AJUDANTES
// =====================================================

// Evita que um texto digitado pelo usuário (ex.: <b>) quebre o HTML da página
function seguro(texto){
    var resultado = String(texto || '')
    resultado = resultado.replace(/&/g, '&amp;')
    resultado = resultado.replace(/</g, '&lt;')
    resultado = resultado.replace(/>/g, '&gt;')
    resultado = resultado.replace(/"/g, '&quot;')
    return resultado
}

// '2026-09-19' vira '19/09/2026'
function formatarData(data){
    var partes = String(data || '').substring(0, 10).split('-')

    if(partes.length != 3){
        return ''
    }

    return partes[2] + '/' + partes[1] + '/' + partes[0]
}

// O que vem depois do "?" no endereço. Ex.: em ficha.html?id=3, parametro('id') devolve '3'
function parametro(nome){
    return new URLSearchParams(window.location.search).get(nome)
}

// Tecla Enter nas páginas sem <form> (login, confirmar, nova-senha): o Enter
// não aperta o botão sozinho. O input chama no onkeydown, por exemplo:
//   <input ... onkeydown="apertouEnter(event, login)">
// e, se a tecla foi Enter, roda a mesma função do botão.
function apertouEnter(evento, funcao){
    if(evento.key == 'Enter'){
        funcao()
    }
}

// Janelas (as caixas que aparecem por cima da página): só colocam e tiram a classe "oculto"
function abrirJanela(id){
    document.getElementById(id).classList.remove('oculto')
}

function fecharJanela(id){
    document.getElementById(id).classList.add('oculto')
}


// =====================================================
// 4. ENVIAR IMAGEM
// =====================================================
// (FileReader não foi visto em aula: é o jeito do navegador ler um arquivo do computador)
//
// campo:  o <input type="file"> onde a pessoa escolheu a imagem
// depois: função que recebe a imagem transformada em TEXTO (ou '' se não escolheu nada).
//         É esse texto que vai para o servidor e fica guardado no banco.
//
// limiteKB: tamanho máximo do arquivo. Se não mandar, vale 2500 KB (2,5 MB)
//           (imagem muito grande deixa o banco pesado).
//
// Ex.: lerImagem(document.getElementById('imagem'), function(imagem){ ... })
function lerImagem(campo, depois, limiteKB){
    var arquivo = campo.files[0]

    if(arquivo == undefined){
        depois('')
        return
    }

    if(limiteKB == undefined){
        limiteKB = 2500
    }

    if(arquivo.size > limiteKB * 1024){
        alert('A imagem precisa ter no máximo ' + limiteKB + ' KB.')
        return
    }

    var leitor = new FileReader()

    // quando terminar de ler, o texto da imagem está em leitor.result.
    // Antes de entregar, a imagem é DIMINUÍDA (função diminuirImagem, logo abaixo).
    leitor.onload = function(){
        diminuirImagem(leitor.result, arquivo, campo, depois)
    }

    leitor.readAsDataURL(arquivo)
}

// Qual o tamanho máximo (em pixels, do lado maior) que cada imagem pode ter.
// O site mostra as fotos pequenas (bolinha do perfil, carta da ficha, card do monstro),
// então 800 px já sobra. A capa do perfil e o mapa da mesa aparecem grandes.
function ladoMaximoDaImagem(campo){
    if(campo.id == 'capaArquivo'){
        return 1400
    }

    if(campo.id == 'mapaArquivo'){
        return 1600
    }

    return 800
}

// Diminui a imagem ANTES de mandar para o servidor:
// desenha a foto num <canvas> (um "quadro" invisível) menor e transforma de novo em texto.
// Assim uma foto de celular de 2 MB vira uns 50 a 100 KB, e cada página que mostra
// essa foto fica muito mais leve (economiza a banda da Vercel e do Render).
// (canvas não foi visto em aula: é o jeito do navegador desenhar e redimensionar imagens)
function diminuirImagem(textoOriginal, arquivo, campo, depois){
    var imagem = new Image()

    imagem.onload = function(){
        var lado = ladoMaximoDaImagem(campo)
        var largura = imagem.width
        var altura = imagem.height

        // a imagem já é pequena: manda do jeito que está
        if(largura <= lado && altura <= lado && arquivo.size <= 300 * 1024){
            depois(textoOriginal)
            return
        }

        // regra de três: o lado maior vira "lado" e o outro diminui na mesma proporção
        if(largura > altura){
            if(largura > lado){
                altura = Math.round(altura * lado / largura)
                largura = lado
            }
        }else{
            if(altura > lado){
                largura = Math.round(largura * lado / altura)
                altura = lado
            }
        }

        var quadro = document.createElement('canvas')
        quadro.width = largura
        quadro.height = altura
        quadro.getContext('2d').drawImage(imagem, 0, 0, largura, altura)

        // PNG, GIF e WEBP podem ter fundo transparente (ex.: monstro recortado):
        // esses viram WEBP, que guarda a transparência e é bem mais leve que PNG.
        // (navegador que não sabe fazer WEBP devolve PNG sozinho, e também funciona)
        // Foto normal (JPG) vira JPEG com qualidade 85%.
        var texto

        if(arquivo.type == 'image/png' || arquivo.type == 'image/gif' || arquivo.type == 'image/webp'){
            texto = quadro.toDataURL('image/webp', 0.85)
        }else{
            texto = quadro.toDataURL('image/jpeg', 0.85)
        }

        // se por algum motivo a versão nova ficou maior, manda a original
        if(texto.length > textoOriginal.length){
            texto = textoOriginal
        }

        depois(texto)
    }

    imagem.onerror = function(){
        alert('Não consegui abrir essa imagem. Tente outra (JPG ou PNG).')
    }

    imagem.src = textoOriginal
}


// =====================================================
// 5. PEDAÇOS DE HTML QUE SE REPETEM
// =====================================================

// Foto de um card. Se não tiver imagem, mostra um quadro com a primeira letra do nome.
function htmlFoto(imagem, nome){
    if(imagem){
        return '<img class="foto" src="' + seguro(imagem) + '" alt="">'
    }

    return '<div class="foto sem-foto">' + seguro(String(nome || '?').charAt(0).toUpperCase()) + '</div>'
}

// Barra de vida em 10 quadradinhos ("gomos"). Os cheios ganham a classe "cheio".
function htmlGomos(atual, maximo){
    var cheios = 0
    var html = ''

    if(maximo > 0){
        cheios = Math.round(atual * 10 / maximo)
    }

    for(var i = 0; i < 10; i++){
        if(i < cheios){
            html += '<i class="cheio"></i>'
        }else{
            html += '<i></i>'
        }
    }

    return '<div class="gomos">' + html + '</div>'
}

// CARTA DE FICHA: o card escuro com o retrato, o nome e os atributos.
// Usada em: fichas.html, inicio.html, campanha.html e perfil.html.
// O visual dela está em css/style.css (procure por ".carta").
//
// ficha:  uma linha que veio do servidor (rota /fichas)
// botoes: HTML dos botões que aparecem no canto de cima (pode ser '')
// Clicar na carta abre a página ficha.html?id=...
function htmlCarta(ficha, botoes){
    return `
        <article class="carta">
            <a class="carta-link" href="ficha.html?id=${ficha.id}">
                ${htmlFoto(ficha.retrato, ficha.nome)}
                <div class="topo-carta"><span class="selo">NV ${ficha.nivel}</span></div>
                <div class="info">
                    <h3>${seguro(ficha.nome)}</h3>
                    <small>${seguro(ficha.raca)} · ${seguro(ficha.classe)}</small>
                    <div class="atributos">
                        <div class="atributo"><span>FOR</span><strong>${ficha.forca}</strong></div>
                        <div class="atributo"><span>DES</span><strong>${ficha.destreza}</strong></div>
                        <div class="atributo"><span>CON</span><strong>${ficha.constituicao}</strong></div>
                        <div class="atributo"><span>INT</span><strong>${ficha.inteligencia}</strong></div>
                        <div class="atributo"><span>SAB</span><strong>${ficha.sabedoria}</strong></div>
                        <div class="atributo"><span>CAR</span><strong>${ficha.carisma}</strong></div>
                    </div>
                    ${htmlGomos(ficha.vidaAtual, ficha.vidaMaxima)}
                </div>
            </a>
            <div class="acoes">${botoes}</div>
        </article>`
}


// =====================================================
// 6. DADO (o botão vermelho no cantinho da tela)
// =====================================================
// O HTML do dado é igual em todas as páginas de dentro:
//   <button class="dado-botao" onclick="abrirDado()">  -> o botão
//   <div class="dado-menu" id="dadoMenu">              -> a caixinha com d4, d6, d8...
//   <div id="dadoResultado">                           -> onde aparece o número sorteado

// abre e fecha a caixinha
function abrirDado(){
    document.getElementById('dadoMenu').classList.toggle('oculto')
}

// lados: 4, 6, 8, 10, 12 ou 20
function rolarDado(lados){
    // Math.random() sorteia um número de 0 a 0,999...
    // multiplicando pelos lados e somando 1, cai entre 1 e o número de lados
    var numero = Math.floor(Math.random() * lados) + 1

    var resultado = document.getElementById('dadoResultado')

    // escreve em <div id="dadoResultado">. O <b> é novo a cada rolagem, e por isso a
    // animação do CSS (.dado-resultado b, no style.css) toca de novo toda vez.
    resultado.innerHTML = '<b>' + numero + '</b><small>d' + lados + '</small>'
    resultado.classList.remove('oculto')
}


// =====================================================
// 7. VISUAL: MODO ESCURO E MENU DO CELULAR
// =====================================================
// O tema fica guardado no localStorage (no navegador), igual o token.
//   'escuro' -> o <body> ganha a classe "escuro" (as cores estão no style.css, parte "MODO ESCURO")
//   qualquer outra coisa (ou nada) -> claro
// O botão para trocar fica em Perfil > Configurações (perfil.html).

function aplicarTema(){
    var tema = localStorage.getItem('tema')

    if(tema == 'escuro'){
        document.body.classList.add('escuro')
    }else{
        document.body.classList.remove('escuro')
    }
}

// tema: 'claro' ou 'escuro'
function mudarTema(tema){
    localStorage.setItem('tema', tema)
    aplicarTema()
}

// roda em toda página que carrega o script.js
aplicarTema()

// Celular: o botão "Mais" da barra de baixo abre e fecha o menu inteiro
function abrirMais(){
    document.querySelector('.lateral').classList.toggle('mais-aberto')
}

// Botão de olho dos campos de senha: mostra ou esconde o que foi digitado.
// O botão fica dentro de <div class="campo-senha"> junto com o input.
function verSenha(botao){
    var caixa = botao.parentElement
    var input = caixa.querySelector('input')

    if(input.type == 'password'){
        input.type = 'text'
        caixa.classList.add('mostrando')
        botao.setAttribute('aria-label', 'Esconder senha')
    }else{
        input.type = 'password'
        caixa.classList.remove('mostrando')
        botao.setAttribute('aria-label', 'Mostrar senha')
    }
}
