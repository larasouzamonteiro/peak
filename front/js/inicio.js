// inicio.js  (página inicio.html)
// A primeira tela depois do login:
//   - o carrossel com as fotos da equipe
//   - as campanhas oficiais da Peak
//   - os meus personagens
//   - as novidades (o que entrou por último no site)

// VISUAL: as fotos do carrossel (as <img class="carrossel-foto"> do inicio.html),
// qual está aparecendo e o relógio que troca sozinho
var fotos = document.querySelectorAll('.carrossel-foto')
var fotoAtual = 0
var relogio = null

if(verificarLogin()){
    carregarMinhaFoto()
    comecarCarrossel()
    carregarOficiais()
    carregarFichas()
    carregarNovidades()

    // primeira vez por aqui (ou pediu para ver de novo em inicio.html?tutorial=sim): a Zero aparece
    if(pegarUsuarioLogado().tutorialVisto == 0 || parametro('tutorial') == 'sim'){
        abrirTutorial()     // função do js/tutorial.js (por isso ele é carregado ANTES deste arquivo no inicio.html)
    }
}


// =====================================================
// TOPO: a bolinha com a foto do meu perfil
// =====================================================
// Escreve em <a id="minhaFoto">. Sem foto, aparece a primeira letra do nome.
function carregarMinhaFoto(){
    var eu = pegarUsuarioLogado()

    buscar('/usuario?id=' + eu.id, function(pessoa){
        var lugar = document.getElementById('minhaFoto')

        if(pessoa.fotoPerfil){
            lugar.innerHTML = '<img src="' + seguro(pessoa.fotoPerfil) + '" alt="">'
        }else{
            lugar.innerHTML = '<span>' + seguro(eu.nomeUsuario.charAt(0).toUpperCase()) + '</span>'
        }
    })
}


// =====================================================
// VISUAL: CARROSSEL DAS FOTOS DA EQUIPE (só front, não usa o servidor)
// =====================================================
// As fotos estão na variável "fotos" (lá em cima).
// Mostrar uma foto = colocar a classe "on" nela e tirar das outras
// (o CSS faz a foto aparecer devagar).

function comecarCarrossel(){
    var mini = ''
    var barras = ''

    // uma miniatura e uma barrinha para cada foto
    for(var i = 0; i < fotos.length; i++){
        mini += '<img src="' + fotos[i].getAttribute('src') + '" alt="" onclick="mostrarFoto(' + i + ')">'
        barras += '<i></i>'
    }

    document.getElementById('miniFotos').innerHTML = mini
    document.getElementById('barrasFoto').innerHTML = barras

    mostrarFoto(0)
}

// numero: qual foto mostrar (0 é a primeira)
function mostrarFoto(numero){
    var minis = document.querySelectorAll('#miniFotos img')
    var barras = document.querySelectorAll('#barrasFoto i')

    fotoAtual = numero

    for(var i = 0; i < fotos.length; i++){
        if(i == numero){
            fotos[i].classList.add('on')
            minis[i].classList.add('on')
            barras[i].classList.add('on')
        }else{
            fotos[i].classList.remove('on')
            minis[i].classList.remove('on')
            barras[i].classList.remove('on')
        }
    }

    document.getElementById('contadorFoto').textContent = (numero + 1) + ' / ' + fotos.length

    // a cada 5 segundos (5000 milissegundos) passa sozinho para a próxima.
    // clearTimeout cancela a contagem antiga, para recomeçar do zero quando alguém clica.
    clearTimeout(relogio)
    relogio = setTimeout(function(){
        mudarFoto(1)
    }, 5000)
}

// setas: passo = 1 (próxima) ou -1 (anterior)
function mudarFoto(passo){
    var proxima = fotoAtual + passo

    // depois da última volta para a primeira, e antes da primeira vai para a última
    if(proxima >= fotos.length){
        proxima = 0
    }

    if(proxima < 0){
        proxima = fotos.length - 1
    }

    mostrarFoto(proxima)
}


// =====================================================
// CAMPANHAS OFICIAIS (do lado do carrossel)
// =====================================================
// As 2 primeiras campanhas oficiais viram cards em <div id="oficiais">
function carregarOficiais(){
    buscar('/campanhas/oficiais', function(oficiais){
        var html = ''

        for(var i = 0; i < oficiais.length && i < 2; i++){
            var o = oficiais[i]
            var texto = 'aventura pronta da Peak'

            if(i == 0){
                texto = 'campanha principal da Peak'
            }

            html += `
                <a class="foto-card" href="campanhas.html">
                    ${htmlFoto(o.imagemCapa, o.nome)}
                    <div class="nome">
                        <span class="selo">Oficial</span>
                        <b>${seguro(o.nome)}</b>
                        <small>${texto}</small>
                    </div>
                </a>`
        }

        document.getElementById('oficiais').innerHTML = html
    })
}


// =====================================================
// SEUS PERSONAGENS
// =====================================================
// As 4 primeiras fichas viram cartas em <section id="filaCartas">,
// e no final vem o quadro "Criar ficha"
function carregarFichas(){
    buscar('/fichas', function(fichas){
        var html = ''

        for(var i = 0; i < fichas.length && i < 4; i++){
            html += htmlCarta(fichas[i], '')
        }

        html += `
            <a class="card-novo" href="criar-ficha.html">
                <img src="../img/icones/mais.svg" alt="">
                Criar ficha
            </a>`

        document.getElementById('filaCartas').innerHTML = html
    })
}


// =====================================================
// NOVIDADES NA PEAK
// =====================================================
// As listas do servidor vêm em ordem de id (order by id no SQL),
// então a ÚLTIMA de cada lista é a que entrou por último.
// São 4 buscas, uma depois da outra; no fim desenha os 4 quadrados.
function carregarNovidades(){
    buscar('/campanhas/oficiais', function(campanhas){
        buscar('/monstros', function(monstros){
            buscar('/racas', function(racas){
                buscar('/classes', function(classes){

                    var html = ''

                    if(campanhas.length > 0){
                        var c = campanhas[campanhas.length - 1]
                        html += htmlNovidade(c.imagemCapa, c.nome, 'Campanha', 'aventura oficial', 'campanhas.html')
                    }

                    if(monstros.length > 0){
                        var m = monstros[monstros.length - 1]
                        html += htmlNovidade(m.imagem, m.nome, 'Monstro', 'vida ' + m.vidaMaxima + ' · defesa ' + m.defesa, 'monstros.html')
                    }

                    if(racas.length > 0){
                        var r = racas[racas.length - 1]
                        html += htmlNovidade(r.imagem, r.nome, 'Raça', 'vida ' + r.vidaMaxima, 'racas.html')
                    }

                    if(classes.length > 0){
                        var cl = classes[classes.length - 1]
                        html += htmlNovidade(cl.imagem, cl.nome, 'Classe', 'para a sua ficha', 'classes.html')
                    }

                    document.getElementById('novidades').innerHTML = html
                })
            })
        })
    })
}

// Um quadrado de novidade: foto, selo "NOVO", tipo, nome e um texto pequeno
function htmlNovidade(imagem, nome, tipo, texto, link){
    return `
        <a class="foto-card novidade" href="${link}">
            ${htmlFoto(imagem, nome)}
            <span class="novo">Novo</span>
            <div class="nome">
                <span class="selo">${tipo}</span>
                <b>${seguro(nome)}</b>
                <small>${seguro(texto)}</small>
            </div>
        </a>`
}
