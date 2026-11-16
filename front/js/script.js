// script.js
// Funções usadas em VÁRIAS páginas (carregado antes do JavaScript de cada página).
//
// O localStorage guarda:
//   usuarioLogado -> quem está logado (id, nomeUsuario, tipo e tutorialVisto)
//   token         -> código que o servidor deu no login
//
// Regra do projeto: o JavaScript NÃO escreve CSS. Para mudar a aparência ele só
// coloca ou tira uma classe (ex.: 'oculto', 'ativo'), e a classe está nos arquivos .css.
//
// ORGANIZAÇÃO: aqui ficam só as coisas NECESSÁRIAS (pedidos ao servidor, login, avisos,
// ajudantes, imagens e pedaços de HTML). Tudo que é só APARÊNCIA (modo escuro, abertura,
// Natal, neve, segredinho) está no visual.js, que é carregado logo depois deste arquivo.

// VERSÃO SERVIDOR: as páginas e o servidor estão no mesmo endereço,
// então o endereço fica vazio ('/login' vai para o próprio site)
var SERVIDOR = ''

// O personagem de presente de cada tema de evento.
// A imagem já vem com o site (não é o admin que cria). Usado na Oficina (criar-ficha.js).
// tema: 'natal'. Devolve o nome e a imagem, ou null se o tema não tem presente.
function retratoDePresente(tema){
    if(tema == 'natal'){
        return {nome: 'Noel', imagem: '../img/eventos/retrato-natal.jpg'}
    }

    return null
}
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
        cache: 'no-store',      // sempre pede a lista nova (sem isso, às vezes o que acabou de ser criado só aparecia ao recarregar)
        headers: {
            'Authorization': meuToken()
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
            'Authorization': meuToken()
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

window.onbeforeunload = function(){
    saindoDaPagina = true
}

window.onpagehide = function(){
    saindoDaPagina = true
}

// voltou para a página pela seta "voltar" do navegador: ela vale de novo
window.onpageshow = function(){
    saindoDaPagina = false
}

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
        avisar('Erro no servidor', 'O servidor respondeu com um erro. Tente de novo.', 'erro')
        return
    }

    avisar('Sem conexão', 'Não consegui falar com o servidor. Tente de novo em 1 minuto (ele pode estar acordando).', 'erro')
}


// =====================================================
// AVISOS (nov/2026): no lugar do alert() e do confirm() do navegador
// =====================================================
// avisar(titulo, texto, tipo, depois)
//   Mostra um aviso no canto de cima e ele some sozinho.
//   Serve para as coisas simples: "Ficha criada!", erros, "Perfil salvo"...
//   titulo -> a linha em negrito (ex.: 'Ficha criada!')
//   texto  -> a linha menor embaixo (pode ser '' para não ter)
//   tipo   -> 'certo' (✓ verde), 'erro' (! vermelho) ou 'info' (i rosa)
//   depois -> opcional: uma função que roda quando o aviso some (ex.: mudar de página).
//             Com o alert antigo o código esperava a pessoa clicar em OK;
//             aqui não espera, por isso o que vem depois vai dentro da função.
//
// confirmar(texto, depois, textoBotao)
//   Abre a caixa no meio da tela com "Cancelar" e o botão rosa.
//   Serve para as coisas importantes: excluir, sair de campanha...
//   "depois" só roda se a pessoa clicar no botão rosa.
//   "textoBotao" é opcional (ex.: 'Excluir'). Se não vier, fica "Confirmar".

function avisar(titulo, texto, tipo, depois){
    // se já tem um aviso na tela, tira (para não empilhar)
    var antigo = document.querySelector('.aviso-canto')

    if(antigo != null){
        antigo.remove()
    }

    // o tipo ('certo', 'erro' ou 'info') vira uma classe: o CSS muda a cor
    if(tipo != 'certo' && tipo != 'erro'){
        tipo = 'info'
    }

    // quando vai mudar de página espera menos (1,8 s); se não, 3,5 s
    var tempo = 3500

    if(depois){
        tempo = 1800
    }

    var aviso = document.createElement('div')
    aviso.className = 'aviso-canto ' + tipo
    aviso.innerHTML = '<b></b><small></small>'

    // textContent: o texto entra como texto, nunca como HTML
    aviso.querySelector('b').textContent = titulo
    if(texto == null){
        texto = ''
    }
    aviso.querySelector('small').textContent = texto

    document.body.appendChild(aviso)

    // um pouco antes de sumir, ganha a classe "saindo" (o CSS faz ele desaparecer devagar)
    setTimeout(function(){
        aviso.classList.add('saindo')
    }, tempo - 400)

    setTimeout(function(){
        aviso.remove()

        if(depois){
            depois()
        }
    }, tempo)
}

function confirmar(texto, depois, textoBotao){
    // a primeira frase (até o "?") vira o título; o resto vira a explicação
    // ex.: 'Excluir esta ficha? Ela sai da campanha também.'
    //      título = 'Excluir esta ficha?'   explicação = 'Ela sai da campanha também.'
    var titulo = texto
    var explicacao = ''
    var fim = texto.indexOf('?')

    if(fim != -1 && fim < texto.length - 1){
        titulo = texto.substring(0, fim + 1)
        explicacao = texto.substring(fim + 1).trim()
    }

    var fundo = document.createElement('div')
    fundo.className = 'confirmar-fundo'
    fundo.innerHTML = `
        <div class="confirmar-caixa">
            <h3></h3>
            <p></p>
            <div class="confirmar-botoes">
                <button type="button" class="confirmar-nao">Cancelar</button>
                <button type="button" class="confirmar-sim"></button>
            </div>
        </div>`

    fundo.querySelector('h3').textContent = titulo
    fundo.querySelector('p').textContent = explicacao

    var botoes = fundo.querySelectorAll('button')

    // se não mandou o texto do botão, fica "Confirmar"
    if(textoBotao == null || textoBotao == ''){
        textoBotao = 'Confirmar'
    }
    botoes[1].textContent = textoBotao

    // Cancelar: só fecha
    botoes[0].onclick = function(){
        fundo.remove()
    }

    // botão rosa: fecha e faz o que foi pedido
    botoes[1].onclick = function(){
        fundo.remove()
        depois()
    }

    document.body.appendChild(fundo)
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
//   <div id="menuLetra">   -> a foto de perfil, na bolinha do menu (ou a foto padrão)
//   <strong id="menuNome"> -> o nome, embaixo do menu
//   <a id="linkAdmin">     -> o link Administração (só aparece para admin)
function verificarLogin(){
    var usuario = pegarUsuarioLogado()

    if(usuario == null || localStorage.getItem('token') == null){
        // guarda a página que a pessoa tentou abrir (ex.: o link de um perfil que alguém mandou).
        // Depois do login, o login.js leva ela de volta para essa página.
        // Só o nome da página e o "?id=..." (location.pathname tem o caminho inteiro; pegamos só o final).
        var pagina = window.location.pathname.split('/').pop() + window.location.search
        sessionStorage.setItem('voltarPara', pagina)

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
    // a foto padrão aparece na hora; quando o servidor responde, entra a foto da pessoa (se tiver)
    document.getElementById('menuLetra').innerHTML = '<img src="' + FOTO_PADRAO + '" alt="">'

    buscar('/usuario?id=' + usuario.id, function(pessoa){
        document.getElementById('menuLetra').innerHTML = '<img src="' + seguro(fotoDePerfil(pessoa.fotoPerfil)) + '" alt="">'
    })
    document.getElementById('menuNome').textContent = usuario.nomeUsuario

    if(usuario.tipo == 'admin'){
        document.getElementById('linkAdmin').classList.remove('oculto')
    }

    return true
}

function sair(){
    var token = meuToken()

    localStorage.removeItem('usuarioLogado')
    localStorage.removeItem('token')

    // VERSÃO SERVIDOR: avisa o servidor para apagar o token (ele para de valer na hora)
    fetch(SERVIDOR + '/logout', {method: 'POST', headers: {'Authorization': token}})
    .finally(() => {
        window.location.href = 'login.html'
    })
}


// =====================================================
// 3. AJUDANTES
// =====================================================

// pega o token salvo no login (se não tiver, manda vazio)
function meuToken(){
    var token = localStorage.getItem('token')

    if(token == null){
        token = ''
    }

    return token
}

// O nome bonito do tema de um evento: 'natal' vira 'Natal'
function nomeDoTema(tema){
    if(tema == 'natal'){
        return 'Natal'
    }else if(tema == 'pascoa'){
        return 'Páscoa'
    }

    return tema
}

// Se o texto estiver vazio, devolve o texto padrão.
// Ex.: textoOuPadrao(pessoa.bio, 'Ainda não escreveu nada.')
function textoOuPadrao(texto, padrao){
    if(texto == null || texto == ''){
        return padrao
    }

    return texto
}

// Evita que um texto digitado pelo usuário (ex.: <b>) quebre o HTML da página
function seguro(texto){
    // vazio (null) vira um texto vazio
    if(texto == null){
        texto = ''
    }

    var resultado = String(texto)
    resultado = resultado.replace(/&/g, '&amp;')
    resultado = resultado.replace(/</g, '&lt;')
    resultado = resultado.replace(/>/g, '&gt;')
    resultado = resultado.replace(/"/g, '&quot;')
    return resultado
}

// '2026-09-19' vira '19/09/2026'
function formatarData(data){
    if(data == null){
        return ''
    }

    var partes = String(data).substring(0, 10).split('-')

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
        avisar('Imagem grande demais', 'A imagem precisa ter no máximo ' + limiteKB + ' KB.', 'erro')
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
        avisar('Imagem inválida', 'Não consegui abrir essa imagem. Tente outra (JPG ou PNG).', 'erro')
    }

    imagem.src = textoOriginal
}


// =====================================================
// 5. PEDAÇOS DE HTML QUE SE REPETEM
// =====================================================

// AS FOTOS PADRÃO: quando a pessoa não envia uma imagem, entra a imagem padrão daquele tipo.
var FOTO_PADRAO = '../img/sem-foto.jpg'      // foto de perfil de quem ainda não colocou uma

// tipo: 'monstro', 'raca', 'classe', 'campanha' ou 'ficha'. Devolve o caminho da imagem padrão.
function fotoPadrao(tipo){
    if(tipo == 'monstro'){
        return '../img/padrao/monstro.jpg'
    }else if(tipo == 'raca'){
        return '../img/padrao/raca.jpg'
    }else if(tipo == 'classe'){
        return '../img/padrao/classe.jpg'
    }else if(tipo == 'ficha'){
        return '../img/retratos/r01.jpg'
    }

    // campanha (e qualquer outro)
    return '../img/criar/nova-campanha.jpg'
}

// foto: a foto de perfil que veio do banco (pode estar vazia)
function fotoDePerfil(foto){
    if(foto == null || foto == ''){
        return FOTO_PADRAO
    }

    return foto
}

// A imagem de um card (monstro, raça, classe, campanha, ficha).
// imagem: a que veio do banco (pode estar vazia) | tipo: 'monstro', 'raca', 'classe', 'campanha' ou 'ficha'
function htmlFoto(imagem, tipo){
    // se não tem imagem, usa a padrão daquele tipo
    if(imagem == null || imagem == ''){
        imagem = fotoPadrao(tipo)
    }

    return '<img class="foto" src="' + seguro(imagem) + '" alt="">'
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
                ${htmlFoto(ficha.retrato, 'ficha')}
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
