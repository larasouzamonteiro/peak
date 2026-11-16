// criar-ficha.js  (página criar-ficha.html, a "Oficina de personagem")
// A ficha é criada em 5 etapas. Todas estão no HTML ao mesmo tempo, mas só UMA aparece:
// as outras ficam com a classe "oculto".
//   1. Identidade   2. Raça   3. Classe   4. Combate e itens   5. Atributos e detalhes

var etapaAtual = 1
var totalEtapas = 5
var LIMITE_ITENS = 3

// o que a pessoa já escolheu
var racaEscolhida = null      // id da raça
var classeEscolhida = null    // id da classe
var itensEscolhidos = []      // ids dos itens (no máximo 3)
var retratoEnviado = ''       // a imagem enviada pela pessoa ('' = usa um retrato pronto)

// listas que vieram do servidor
var racas = []
var classes = []
var itens = []

if(verificarLogin()){
    carregarListas()
}

// Busca as raças, as classes e os itens e desenha as três grades
function carregarListas(){
    buscar('/racas', function(lista){
        racas = lista
        desenharRacas()
    })

    buscar('/classes', function(lista){
        classes = lista
        desenharClasses()
    })

    buscar('/itens', function(lista){
        itens = lista
        desenharItens()
    })

     // os retratos de presente que a pessoa ganhou nos eventos (ex.: a Noel do Natal)
    buscar('/retratos/ganhos', function(lista){
        desenharRetratosGanhos(lista)
    })
    
}
   

// Coloca os retratos de presente no COMEÇO da lista de retratos.
// O servidor só manda o tema e o "novo"; o nome e a imagem vêm do retratoDePresente (script.js).
function desenharRetratosGanhos(lista){
    var html = ''

    for(var i = 0; i < lista.length; i++){
        var presente = retratoDePresente(lista[i].tema)

        // um tema que o site não conhece: pula
        if(presente == null){
            continue
        }

        // o selo NOVO só aparece nos 7 primeiros dias
        var selo = ''

        if(lista[i].novo == 1){
            selo = '<span class="selo-novo">NOVO</span>'
        }

        html += `<label class="retrato-opcao retrato-presente">
            <input type="radio" name="retrato" value="${presente.imagem}" onchange="escolherRetratoPronto()">
            ${selo}
            <img class="retrato" src="${presente.imagem}" alt="">${presente.nome}
        </label>`
    }

    // os retratos de presente entram ANTES dos que já estão na lista
    var caixa = document.getElementById('escolhasRetrato')
    caixa.innerHTML = html + caixa.innerHTML
}

// =====================================================
// ETAPAS
// =====================================================

// Mostra a etapa "numero" e esconde as outras.
// Mexe em: <div id="etapa1"> até <div id="etapa5">, <div id="indicadorEtapas">,
//          <p id="textoEtapa"> e os botões Voltar, Próximo e Salvar.
function mostrarEtapa(numero){
    etapaAtual = numero

    for(var i = 1; i <= totalEtapas; i++){
        if(i == etapaAtual){
            document.getElementById('etapa' + i).classList.remove('oculto')
        }else{
            document.getElementById('etapa' + i).classList.add('oculto')
        }
    }

    // indicador do topo: "ativa" na etapa atual, "feita" nas anteriores
    var marcas = document.querySelectorAll('#indicadorEtapas .etapa-marca')

    for(var i = 0; i < marcas.length; i++){
        if(i + 1 == etapaAtual){
            marcas[i].classList.add('ativa')
        }else{
            marcas[i].classList.remove('ativa')
        }
        if(i + 1 < etapaAtual){
            marcas[i].classList.add('feita')
        }else{
            marcas[i].classList.remove('feita')
        }
    }

    document.getElementById('textoEtapa').textContent = 'Etapa ' + etapaAtual + ' de ' + totalEtapas
    document.getElementById('alert').textContent = ''

    // Voltar não aparece na 1ª etapa; na última, o Próximo dá lugar ao Salvar
    if(etapaAtual == 1){
        document.getElementById('botaoVoltar').classList.add('oculto')
    }else{
        document.getElementById('botaoVoltar').classList.remove('oculto')
    }
    if(etapaAtual == totalEtapas){
        document.getElementById('botaoProximo').classList.add('oculto')
    }else{
        document.getElementById('botaoProximo').classList.remove('oculto')
    }
    if(etapaAtual != totalEtapas){
        document.getElementById('botaoSalvarFicha').classList.add('oculto')
    }else{
        document.getElementById('botaoSalvarFicha').classList.remove('oculto')
    }

    window.scrollTo(0, 0)
}

function proximo(){
    if(etapaValida(etapaAtual)){
        mostrarEtapa(etapaAtual + 1)
    }
}

function voltar(){
    mostrarEtapa(etapaAtual - 1)
}

// Clicar numa etapa lá em cima: só volta para uma etapa que já passou
// (para ir para frente tem que usar o Próximo, que confere os campos)
function irParaEtapa(numero){
    if(numero < etapaAtual){
        mostrarEtapa(numero)
    }
}

// Confere os campos de uma etapa. Devolve true se estiver tudo certo.
// Se não estiver, escreve o motivo em <p id="alert">.
function etapaValida(numero){
    var erro = ''

    if(numero == 1 && document.getElementById('nome').value.trim() == ''){
        erro = 'Digite o nome do personagem'
    }

    if(numero == 2 && racaEscolhida == null){
        erro = 'Escolha uma raça'
    }

    if(numero == 3 && classeEscolhida == null){
        erro = 'Escolha uma classe'
    }

    if(numero == 4){
        var maxima = Number(document.getElementById('vidaMaxima').value)
        var atual = Number(document.getElementById('vidaAtual').value)

        if(maxima < 1 || maxima > 1000){
            erro = 'A vida máxima precisa ser de 1 a 1000'
        }else if(atual < 0 || atual > maxima){
            erro = 'A vida atual precisa ficar entre 0 e a vida máxima'
        }
    }

    document.getElementById('alert').textContent = erro

    // deu erro: sobe a página para a pessoa ver a mensagem (ela fica em cima)
    if(erro != ''){
        window.scrollTo(0, 0)
    }

    return erro == ''
}


// =====================================================
// ETAPA 1: retrato enviado
// =====================================================

// A pessoa escolheu um arquivo em <input id="retratoArquivo">
function usarRetratoEnviado(){
    lerImagem(document.getElementById('retratoArquivo'), function(imagem){
        retratoEnviado = imagem

        // desmarca o retrato pronto: assim, clicar nele de novo "volta atrás"
        var marcado = document.querySelector('input[name="retrato"]:checked')

        if(marcado != null){
            marcado.checked = false
        }

        desenharResumo()
    })
}

// A pessoa clicou num retrato pronto (onchange de cada <input name="retrato">):
// esquece a foto enviada e limpa o campo do arquivo.
// (antes, depois de enviar uma foto, não dava mais para voltar para um retrato pronto)
function escolherRetratoPronto(){
    retratoEnviado = ''
    document.getElementById('retratoArquivo').value = ''
    desenharResumo()
}

// O retrato que vale: o enviado, ou o retrato pronto que está marcado
function retratoEscolhido(){
    if(retratoEnviado != ''){
        return retratoEnviado
    }

    var marcado = document.querySelector('input[name="retrato"]:checked')

    // nenhum marcado: usa o primeiro da lista
    if(marcado == null){
        marcado = document.querySelector('input[name="retrato"]')
    }

    return marcado.value
}


// =====================================================
// ETAPAS 2 E 3: raça e classe
// =====================================================

// Um card de raça. A classe "selecionado" marca a que foi escolhida.
function htmlCardRaca(raca){
    var selecionado = ''

    if(raca.id == racaEscolhida){
        selecionado = 'selecionado'
    }

    // a linha pequena embaixo do nome: da Peak ou de quem criou
    var origem = 'Peak'

    if(raca.autor){
        origem = 'por ' + raca.autor
    }

    // VISUAL: o mesmo card dos monstros do Bestiário (foto-card)
    return `
        <button type="button" class="foto-card ${selecionado}" onclick="escolherRaca(${raca.id})">
            ${htmlFoto(raca.imagem, 'raca')}
            <div class="etiquetas"><span class="selo">♥ ${raca.vidaMaxima}</span></div>
            <div class="nome"><b>${seguro(raca.nome)}</b><small>${seguro(origem)}</small></div>
        </button>`
}

// Desenha as raças em duas grades:
//   <div id="gradeRacas">            -> as oficiais (usuarioId vazio)
//   <div id="gradeRacasComunidade">  -> as criadas por jogadores
function desenharRacas(){
    var oficiais = ''
    var comunidade = ''

    for(var i = 0; i < racas.length; i++){
        if(racas[i].usuarioId == null){
            oficiais += htmlCardRaca(racas[i])
        }else{
            comunidade += htmlCardRaca(racas[i])
        }
    }

    if(comunidade == ''){
        comunidade = '<p class="texto-suave">Nenhuma raça da comunidade ainda.</p>'
    }

    document.getElementById('gradeRacas').innerHTML = oficiais
    document.getElementById('gradeRacasComunidade').innerHTML = comunidade
}

function escolherRaca(id){
    racaEscolhida = id

    // a vida máxima começa com o valor da raça escolhida
    for(var i = 0; i < racas.length; i++){
        if(racas[i].id == id){
            document.getElementById('vidaMaxima').value = racas[i].vidaMaxima
            document.getElementById('vidaAtual').value = racas[i].vidaMaxima
        }
    }

    desenharRacas()
    desenharResumo()
}

function htmlCardClasse(classe){
    var selecionado = ''

    if(classe.id == classeEscolhida){
        selecionado = 'selecionado'
    }

    var origem = 'Peak'

    if(classe.autor){
        origem = 'por ' + classe.autor
    }

    // VISUAL: o mesmo card dos monstros do Bestiário (foto-card)
    return `
        <button type="button" class="foto-card ${selecionado}" onclick="escolherClasse(${classe.id})">
            ${htmlFoto(classe.imagem, 'classe')}
            <div class="nome"><b>${seguro(classe.nome)}</b><small>${seguro(origem)}</small></div>
        </button>`
}

// Igual às raças: <div id="gradeClasses"> e <div id="gradeClassesComunidade">
function desenharClasses(){
    var oficiais = ''
    var comunidade = ''

    for(var i = 0; i < classes.length; i++){
        if(classes[i].usuarioId == null){
            oficiais += htmlCardClasse(classes[i])
        }else{
            comunidade += htmlCardClasse(classes[i])
        }
    }

    if(comunidade == ''){
        comunidade = '<p class="texto-suave">Nenhuma classe da comunidade ainda.</p>'
    }

    document.getElementById('gradeClasses').innerHTML = oficiais
    document.getElementById('gradeClassesComunidade').innerHTML = comunidade
}

function escolherClasse(id){
    classeEscolhida = id
    desenharClasses()
    desenharResumo()
}

// Abre e fecha a área "da comunidade" (id = 'racasComunidade' ou 'classesComunidade')
function abrirComunidade(id){
    document.getElementById(id).classList.toggle('oculto')
}


// =====================================================
// ETAPA 4: itens
// =====================================================

// Desenha os itens em <div id="gradeItens"> e atualiza <span id="contadorItens">
function desenharItens(){
    var html = ''

    for(var i = 0; i < itens.length; i++){
        var item = itens[i]
        // indexOf procura o item na lista dos escolhidos (-1 = não está lá)
        var selecionado = ''

        if(itensEscolhidos.indexOf(item.id) != -1){
            selecionado = 'selecionado'
        }

        html += `
            <button type="button" class="item-card ${selecionado}" onclick="trocarItem(${item.id})">
                <div class="item-img"><img src="${seguro(item.imagem)}" alt=""></div>
                <span><strong>${seguro(item.nome)}</strong><small>${seguro(item.tipo)}</small></span>
            </button>`
    }

    document.getElementById('gradeItens').innerHTML = html
    document.getElementById('contadorItens').textContent = itensEscolhidos.length + ' de ' + LIMITE_ITENS
}

// Clicar num item coloca na lista; clicar de novo tira
function trocarItem(id){
    var posicao = itensEscolhidos.indexOf(id)

    if(posicao != -1){
        itensEscolhidos.splice(posicao, 1)      // já estava: tira
    }else if(itensEscolhidos.length < LIMITE_ITENS){
        itensEscolhidos.push(id)                // não estava e ainda cabe: coloca
    }else{
        avisar('Itens demais', 'Escolha no máximo ' + LIMITE_ITENS + ' itens.', 'erro')
    }

    desenharItens()
    desenharResumo()
}


// =====================================================
// ETAPA 5: atributos
// =====================================================

var camposAtributos = ['forca', 'destreza', 'constituicao', 'inteligencia', 'sabedoria', 'carisma']

// Soma de 3 dados de 6 lados (resultado de 3 a 18)
function rolar3d6(){
    var soma = 0

    for(var i = 0; i < 3; i++){
        soma = soma + Math.floor(Math.random() * 6) + 1
    }

    return soma
}

// tipo: 'equilibrado' (todos 12), 'aleatorio' (sorteia) ou 'personalizado' (a pessoa digita)
function gerarAtributos(tipo){
    for(var i = 0; i < camposAtributos.length; i++){
        var campo = document.getElementById(camposAtributos[i])

        if(tipo == 'equilibrado'){
            campo.value = 12
        }

        if(tipo == 'aleatorio'){
            campo.value = rolar3d6()
        }

        // só no personalizado a pessoa consegue digitar
        campo.readOnly = (tipo != 'personalizado')
    }
}


// =====================================================
// RESUMO (coluna da direita)
// =====================================================

// Escreve o que já foi escolhido em:
//   <img id="resumoRetrato">, <h3 id="resumoNome">, <p id="resumoLinha"> e <p id="resumoItens">
function desenharResumo(){
    var nome = document.getElementById('nome').value.trim()
    var partes = []

    for(var i = 0; i < racas.length; i++){
        if(racas[i].id == racaEscolhida){
            partes.push(racas[i].nome)
        }
    }

    for(var i = 0; i < classes.length; i++){
        if(classes[i].id == classeEscolhida){
            partes.push(classes[i].nome)
        }
    }

    document.getElementById('resumoRetrato').src = retratoEscolhido()
    document.getElementById('resumoNome').textContent = textoOuPadrao(nome, 'Seu personagem')

    if(partes.length == 0){
        document.getElementById('resumoLinha').textContent = ''
    }else{
        partes.push('Vida ' + document.getElementById('vidaMaxima').value)
        document.getElementById('resumoLinha').textContent = partes.join(' · ')
    }

    var nomesItens = []

    for(var i = 0; i < itens.length; i++){
        if(itensEscolhidos.indexOf(itens[i].id) != -1){
            nomesItens.push(itens[i].nome)
        }
    }

    if(nomesItens.length == 0){
        document.getElementById('resumoItens').textContent = ''
    }else{
        document.getElementById('resumoItens').textContent = 'Itens: ' + nomesItens.join(', ')
    }
}


// =====================================================
// SALVAR
// =====================================================

function salvarFicha(){

    // confere as etapas de novo antes de mandar (se uma falhar, volta para ela)
    for(var i = 1; i <= 4; i++){
        if(etapaValida(i) == false){
            var erro = document.getElementById('alert').textContent
            mostrarEtapa(i)
            document.getElementById('alert').textContent = erro
            return
        }
    }

    // etapa 5: o nível (as outras etapas já foram conferidas acima)
    var nivel = Number(document.getElementById('nivel').value)

    if(nivel < 1 || nivel > 100){
        document.getElementById('alert').textContent = 'O nível precisa ser de 1 a 100'
        window.scrollTo(0, 0)
        return
    }

    var ficha = {
        nome: document.getElementById('nome').value.trim(),
        retrato: retratoEscolhido(),
        racaId: racaEscolhida,
        classeId: classeEscolhida,
        nivel: document.getElementById('nivel').value,
        vidaMaxima: document.getElementById('vidaMaxima').value,
        vidaAtual: document.getElementById('vidaAtual').value,
        forca: document.getElementById('forca').value,
        destreza: document.getElementById('destreza').value,
        constituicao: document.getElementById('constituicao').value,
        inteligencia: document.getElementById('inteligencia').value,
        sabedoria: document.getElementById('sabedoria').value,
        carisma: document.getElementById('carisma').value,
        alinhamento: document.getElementById('alinhamento').value,
        personalidade: document.getElementById('personalidade').value.trim(),
        historia: document.getElementById('historia').value.trim(),
        itemIds: itensEscolhidos
    }

    enviar('/fichas/criar', ficha, function(dados){

        if(dados.hasOwnProperty('error')){
            document.getElementById('alert').textContent = dados.error
            window.scrollTo(0, 0)
            return
        }

        avisar(dados.message, 'Levando você para as suas fichas…', 'certo', function(){
            window.location.href = 'fichas.html'
        })
    })
}
