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
    fetch(SERVIDOR + rota, {
        method: 'GET',
        headers: {
            'Authorization': localStorage.getItem('token') || ''
        }
    })
    .then((response) => response.json())
    .then((dados) => {
        // token velho ou errado: volta para o login
        if(dados.sair){
            sair()
            return
        }

        depois(dados)
    })
    .catch(() => {
        alert('Não consegui falar com o servidor. Tente de novo em 1 minuto (ele pode estar acordando).')
    })
}

// POST: manda dados. Ex.: enviar('/fichas/criar', {nome: 'Aria'}, function(dados){ ... })
function enviar(rota, corpo, depois){
    fetch(SERVIDOR + rota, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'Authorization': localStorage.getItem('token') || ''
        },
        body: JSON.stringify(corpo)
    })
    .then((response) => response.json())
    .then((dados) => {
        if(dados.sair){
            sair()
            return
        }

        depois(dados)
    })
    .catch(() => {
        alert('Não consegui falar com o servidor. Tente de novo em 1 minuto (ele pode estar acordando).')
    })
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
// limiteKB: tamanho máximo do arquivo. Se não mandar, vale 500 KB
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
        limiteKB = 500
    }

    if(arquivo.size > limiteKB * 1024){
        alert('A imagem precisa ter no máximo ' + limiteKB + ' KB.')
        return
    }

    var leitor = new FileReader()

    // quando terminar de ler, o texto da imagem está em leitor.result
    leitor.onload = function(){
        depois(leitor.result)
    }

    leitor.readAsDataURL(arquivo)
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
