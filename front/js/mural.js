// mural.js  (página comunidade.html)
// O MURAL DA COMUNIDADE: os recados "Procuro" / "Ofereço" no estilo Pinterest.
//
// O HTML e o CSS da página já estão prontos (comunidade.html e comunidade.css).
// A Amanda vai escrever as funções aqui, uma etapa por vez.
// As pessoas (lista, filtros e "combina") continuam na página do lado: pessoas.html (js/comunidade.js).

// a lista de recados que veio do servidor (fica guardada para os filtros usarem depois)
var recados = []
// o que a pessoa escolheu para o recado novo
var tipoEscolhido = ''             // '' = nenhum (Procuro e Ofereço são opcionais)
var tagsEscolhidas = []            // os ids das tags marcadas (no máximo 3)

var filtro = 'tudo'                // 'tudo', 'procuro', 'ofereco' ou 'combina'
var meuProcuro = []                // os nomes do que eu procuro (ex.: ['Ilustrador'])

if(verificarLogin()){
    
    carregarRecados()
    
    carregarTags()
    //os dois botoes de tipo chamam a mesma função
    document.getElementById('tipoProcuro').onclick = function(){ escolherTipo('procuro') }
    document.getElementById('tipoOfereco').onclick = function(){ escolherTipo('ofereco') }     
    
    document.getElementById('botaoPublicar').onclick = publicarRecado

    // ENTER na caixa do recado também publica (igual a clicar em "Publicar")
    document.getElementById('recadoTexto').onkeydown = function(evento){
        if(evento.key == 'Enter'){
            publicarRecado()
        }
    }

    // VISUAL (celular): tocou na caixa do recado, aparecem o Procuro/Ofereço e as tags
    // (o CSS só mostra essa fileira quando a caixa tem a classe "escrevendo")
    document.getElementById('recadoTexto').onfocus = function(){
        document.querySelector('.mural-postar').classList.add('escrevendo')
    }

    // quando escolhe uma foto, o botão da foto fica escuro (para a pessoa saber que tem foto)
    document.getElementById('recadoFoto').onchange = function(){
        if(this.files.length > 0){
            document.querySelector('.mural-foto-bt').classList.add('ativo')
        }else{
            document.querySelector('.mural-foto-bt').classList.remove('ativo')
        }
    }

    carregarEmAlta()
    mostrarMinhaFoto()
    carregarMinhaParceria()
    // os 4 filtros chamam a mesma função

    document.getElementById('filtroTudo').onclick = function(){ escolherFiltro('tudo') }
    document.getElementById('filtroProcuro').onclick = function(){ escolherFiltro('procuro') }
    document.getElementById('filtroOfereco').onclick = function(){ escolherFiltro('ofereco') }
    document.getElementById('filtroCombina').onclick = function(){ escolherFiltro('combina') }


   
}

// Pede os recados ao servidor (rota GET /recados do app.js)
function carregarRecados(){
    buscar('/recados', function(lista){
        recados = lista

            desenharRecados()// desenha de novo, agora sabendo o que eu procuro
            carregarPessoasMural() // a fileira de pessoas também precisa saber o que eu procuro
    })
}
// Coloca os recados nas duas colunas: 1º na esquerda, 2º na direita, 3º na esquerda...
// Só entram os recados que passam no filtro escolhido.
function desenharRecados(){
    var esquerda = ''
    var direita = ''
    var quantos = 0        // quantos recados já foram colocados (para alternar as colunas)

    for(var i = 0; i < recados.length; i++){
        var r = recados[i]

        // pula os que não passam no filtro
        if(filtro == 'procuro' && r.tipo != 'procuro'){ continue }
        if(filtro == 'ofereco' && r.tipo != 'ofereco'){ continue }
        if(filtro == 'combina' && !combina(r)){ continue }

        if(quantos % 2 == 0){
            esquerda += htmlRecado(r)
        }else{
            direita += htmlRecado(r)
        }

        quantos++
    }

    document.getElementById('colunaEsquerda').innerHTML = esquerda
    document.getElementById('colunaDireita').innerHTML = direita

    // a frase de "vazio" muda: sem nenhum recado no mural ou sem nenhum neste filtro
    var vazio = document.getElementById('muralVazio')

    if(recados.length == 0){
        vazio.textContent = 'Ainda não tem recados. Seja a primeira pessoa a postar!'
    }else{
        vazio.textContent = 'Nenhum recado neste filtro.'
    }

    if(quantos > 0){
        vazio.classList.add('oculto')
    }else{
        vazio.classList.remove('oculto')
    }
}

// Monta o HTML de UM recado (o modelo está no comentário do comunidade.html)
function htmlRecado(r){
    // Procuro, Ofereço ou nenhum (sem tipo, a etiqueta não aparece)
    var etiqueta = ''

    if(r.tipo == 'procuro'){
        etiqueta = '<span class="recado-tipo procuro">Procuro</span>'
    }else if(r.tipo == 'ofereco'){
        etiqueta = '<span class="recado-tipo">Ofereço</span>'
    }

    // as tags vêm juntas com vírgula ("Fantasia,Terror") e viram "#Fantasia #Terror"
    var tags = ''

    if(r.tags){
        tags = '#' + r.tags.split(',').join(' #')
    }

    // foto de quem postou (se a pessoa não tiver, usa a foto padrão)
    var fotoPessoa = fotoDePerfil(r.fotoPerfil)

    // com foto: a foto em cima | sem foto: vira cartão de frase
    var foto = ''
    var classeRecado = 'recado recado-frase'

    if(r.foto){
        foto = '<img class="recado-foto" src="' + seguro(r.foto) + '" alt="">'
        classeRecado = 'recado'
    }

        // lixinho: só nos meus recados (ou em todos, se eu for admin)
    var eu = pegarUsuarioLogado()
    var lixo = ''

    if(r.usuarioId == eu.id || eu.tipo == 'admin'){
        lixo = '<button type="button" class="botao-icone excluir recado-apagar" title="Apagar" aria-label="Apagar" onclick="apagarRecado(' + r.id + ')"></button>'
    }

    //tenho interesse

    var interesse = ''

    if(r.usuarioId == eu.id){
        // e o MEU recado: combina quem se interessou ( se alguém já se interessou )
        if(r.interessados > 0){
            var nomes  = r.nomesInteressados.split(',').join(', ')
            interesse = '<p class ="recado-interesse-lista">♥ ' + r.interessados + ' com interesse: ' + seguro(nomes) + '</p>'
        }
        
    }else{
         // recado de OUTRA pessoa: o botão de marcar/desmarcar
        var marcado = ''
        var coracao = '♡'

        if(r.euMarquei > 0){
            marcado = ' marcado'
            coracao = '♥'
        }

        interesse = '<button type="button" class="recado-interesse' + marcado + '" onclick="marcarInteresse(' + r.id + ')">' +
                    coracao + ' Tenho interesse · ' + r.interessados + '</button>'
    }
    


    return `
        <div class="${classeRecado}">
            ${foto}
            ${lixo}
            ${etiqueta}
            <div class="recado-corpo">
                <p>${seguro(r.texto)}</p>
                <div class="recado-tags">${seguro(tags)}</div>
                ${interesse}
                <div class="recado-autor">
                    <img src="${seguro(fotoPessoa)}" alt="">
                    <div><b>${seguro(r.nomeUsuario)}</b><small>${seguro(r.sou)}</small></div>
                    <a class="recado-chamar" href="perfil.html?id=${r.usuarioId}">Chamar ›</a>
                </div>
            </div>
        </div>`
}

// Procuro ou Ofereço: guarda a escolha e deixa só o botão escolhido escuro.
// Clicar de novo no que já está escolhido DESMARCA (fica sem tipo nenhum).
function escolherTipo(tipo){
    if(tipoEscolhido == tipo){
        tipoEscolhido = ''
    }else{
        tipoEscolhido = tipo
    }

    tipo = tipoEscolhido

    if(tipo == 'procuro'){
        document.getElementById('tipoProcuro').classList.add('ativo')
    }else{
        document.getElementById('tipoProcuro').classList.remove('ativo')
    }
    if(tipo == 'ofereco'){
        document.getElementById('tipoOfereco').classList.add('ativo')
    }else{
        document.getElementById('tipoOfereco').classList.remove('ativo')
    }
}

// Busca a lista de interesses e desenha uma tag (chip) para cada um em <div id="recadoTags">
function carregarTags(){
    buscar('/interesses', function(interesses){
        var html = ''

        for(var i = 0; i < interesses.length; i++){
            var t = interesses[i]
            html += '<button type="button" class="chip chip-botao" id="tag' + t.id + '" onclick="marcarTag(' + t.id + ')">#' + seguro(t.nome) + '</button>'
        }

        document.getElementById('recadoTags').innerHTML = html
    })
}

// Marca ou desmarca uma tag (no máximo 3)
function marcarTag(id){
    var posicao = tagsEscolhidas.indexOf(id)     // -1 quer dizer que ainda não estava marcada

    if(posicao == -1){
        if(tagsEscolhidas.length == 3){
            avisar('Só 3 tags', 'Desmarque uma para escolher outra.', 'info')
            return
        }
        tagsEscolhidas.push(id)                  // coloca na lista
    }else{
        tagsEscolhidas.splice(posicao, 1)        // tira da lista
    }

    // a tag fica escura quando está marcada
    if(posicao == -1){
        document.getElementById('tag' + id).classList.add('ativo')
    }else{
        document.getElementById('tag' + id).classList.remove('ativo')
    }
}

// Publica o recado novo (rota POST /recados/publicar do app.js)
function publicarRecado(){
    var texto = document.getElementById('recadoTexto').value.trim()

    if(texto == ''){
        avisar('Falta o texto', 'Escreva o seu recado antes de publicar.', 'info')
        return
    }

    // lê a foto (se não tiver, "foto" chega vazia: '')
    lerImagem(document.getElementById('recadoFoto'), function(foto){

        var recado = {
            texto: texto,
            tipo: tipoEscolhido,
            tags: tagsEscolhidas.join(','),     // [2, 6] vira "2,6"
            foto: foto
        }

        enviar('/recados/publicar', recado, function(dados){

            if(dados.hasOwnProperty('error')){
                avisar('Não deu certo', dados.error, 'erro')
                return
            }

            avisar('Recado publicado!', 'Ele já aparece no mural.', 'certo')
            limparRecado()
            carregarRecados()            
            carregarEmAlta()      // as tags novas podem mudar o "Em alta"
        })
    })
}

// Deixa a caixa de postar vazia de novo
function limparRecado(){
    document.getElementById('recadoTexto').value = ''
    document.getElementById('recadoFoto').value = ''
    document.querySelector('.mural-foto-bt').classList.remove('ativo')
    document.querySelector('.mural-postar').classList.remove('escrevendo')

    // desmarca as tags
    for(var i = 0; i < tagsEscolhidas.length; i++){
        document.getElementById('tag' + tagsEscolhidas[i]).classList.remove('ativo')
    }
    tagsEscolhidas = []

    // o tipo também volta para "nenhum"
    tipoEscolhido = ''
    document.getElementById('tipoProcuro').classList.remove('ativo')
    document.getElementById('tipoOfereco').classList.remove('ativo')
}

// "Em alta no mural": as tags mais usadas (rota GET /recados/em-alta)
// Cada linha fica assim: 1  #D&D  3 recados
function carregarEmAlta(){
    buscar('/recados/em-alta', function(tags){
        var html = ''

        for(var i = 0; i < tags.length; i++){
            var palavra = 'recados'

            if(tags[i].total == 1){
                palavra = 'recado'
            }

            html += `
                <div class="em-alta-linha">
                    <span>${i + 1}</span>
                    <b>#${seguro(tags[i].nome)}</b>
                    <small>${tags[i].total} ${palavra}</small>
                </div>`
        }

        if(html == ''){
            html = '<p class="texto-suave">Nenhuma tag usada ainda.</p>'
        }

        document.getElementById('emAlta').innerHTML = html
    })
}

// A bolinha do lado do "O que você procura..." mostra a foto de quem está logado
function mostrarMinhaFoto(){
    var eu = pegarUsuarioLogado()

    buscar('/usuario?id=' + eu.id, function(pessoa){
        var lugar = document.getElementById('muralMinhaFoto')

        // sem foto: a foto padrão (fotoDePerfil, do script.js)
        lugar.innerHTML = '<img src="' + seguro(fotoDePerfil(pessoa.fotoPerfil)) + '" alt="">'
    })
}

// "Sua parceria": o que eu sou e o que eu procuro (rota GET /usuario/parcerias)
function carregarMinhaParceria(){
    var eu = pegarUsuarioLogado()

    buscar('/usuario/parcerias?id=' + eu.id, function(parcerias){
        var sou = ''
        var procuro = ''
        meuProcuro = []

        for(var i = 0; i < parcerias.length; i++){
            var chip = '<span class="chip">' + seguro(parcerias[i].nome) + '</span>'

            if(parcerias[i].tipo == 'sou'){
                sou += chip
            }else{
                procuro += chip
                meuProcuro.push(parcerias[i].nome)
            }
        }

        document.getElementById('meuSou').innerHTML = textoOuPadrao(sou, '<small class="texto-suave">nada marcado</small>')
        document.getElementById('meuProcuro').innerHTML = textoOuPadrao(procuro, '<small class="texto-suave">nada marcado</small>')

        desenharRecados()     // desenha de novo, agora sabendo o que eu procuro
    })
}

// Um recado "combina" quando quem postou É algo que eu PROCURO
function combina(r){
    // o meu próprio recado não conta, e quem não marcou nada não combina
    if(r.usuarioId == pegarUsuarioLogado().id || !r.sou){
        return false
    }

    var oQueAPessoaE = r.sou.split(',')

    for(var i = 0; i < oQueAPessoaE.length; i++){
        if(meuProcuro.indexOf(oQueAPessoaE[i]) != -1){
            return true
        }
    }

    return false
}

// Os botões de filtro: guarda a escolha, deixa só ele escuro e desenha de novo
function escolherFiltro(nome){
    filtro = nome

    if(nome == 'tudo'){
        document.getElementById('filtroTudo').classList.add('ativo')
    }else{
        document.getElementById('filtroTudo').classList.remove('ativo')
    }
    if(nome == 'procuro'){
        document.getElementById('filtroProcuro').classList.add('ativo')
    }else{
        document.getElementById('filtroProcuro').classList.remove('ativo')
    }
    if(nome == 'ofereco'){
        document.getElementById('filtroOfereco').classList.add('ativo')
    }else{
        document.getElementById('filtroOfereco').classList.remove('ativo')
    }
    if(nome == 'combina'){
        document.getElementById('filtroCombina').classList.add('ativo')
    }else{
        document.getElementById('filtroCombina').classList.remove('ativo')
    }

    desenharRecados()
}


// Apaga um recado (rota POST /recados/apagar do app.js)
function apagarRecado(id){
    confirmar('Apagar este recado? Ele some do mural para todo mundo.', function(){

        enviar('/recados/apagar', {id: id}, function(dados){

            if(dados.hasOwnProperty('error')){
                avisar('Não deu certo', dados.error, 'erro')
                return
            }

            avisar('Recado apagado!', '', 'certo')
            carregarRecados()
            carregarEmAlta()      // as tags dele saem do "Em alta"
        })

    }, 'Apagar')
}

// Marca ou desmarca "Tenho interesse" (rota POST /recados/interesse do app.js)
function marcarInteresse(id){
    enviar('/recados/interesse', {id: id}, function(dados){

        if(dados.hasOwnProperty('error')){
            avisar('Não deu certo', dados.error, 'erro')
            return
        }

        if(dados.marcado){
            avisar('Interesse marcado!', 'A pessoa vai ver que você se interessou.', 'certo')
        }

        carregarRecados()     // busca de novo para atualizar o número
    })
}

// A fileira de pessoas (tipo stories) em <div id="muralPessoas">
// Rotas: GET /comunidade/pessoas e GET /comunidade/parcerias
function carregarPessoasMural(){
    var eu = pegarUsuarioLogado()

    buscar('/comunidade/pessoas', function(pessoas){
        buscar('/comunidade/parcerias', function(parcerias){
            var html = ''

            for(var i = 0; i < pessoas.length; i++){
                var p = pessoas[i]

                // eu não apareço na minha própria fileira
                if(p.id == eu.id){
                    continue
                }

                // a pessoa combina se ela É algo que eu PROCURO
                var combinaComigo = false

                for(var j = 0; j < parcerias.length; j++){
                    if(parcerias[j].usuarioId == p.id && parcerias[j].tipo == 'sou' && meuProcuro.indexOf(parcerias[j].nome) != -1){
                        combinaComigo = true
                    }
                }

               

                var classe = 'pessoa-bola'
                var selo = ''

                if(combinaComigo){
                    classe = 'pessoa-bola combina'   // o anel colorido (está no comunidade.css)
                    selo = '<small>combina</small>'
                }

                html += '<a class="' + classe + '" href="perfil.html?id=' + p.id + '">' +
                            '<span><img class="foto" src="' + seguro(fotoDePerfil(p.fotoPerfil)) + '" alt=""></span>' +
                            '<b>' + seguro(p.nomeUsuario) + '</b>' +
                            selo +
                        '</a>'
            }

            document.getElementById('muralPessoas').innerHTML = html
        })
    })
}