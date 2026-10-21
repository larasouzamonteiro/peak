// inicio.js  (página inicio.html)
// A primeira tela depois do login:
//   - o banner com as fotos da equipe e as campanhas oficiais
//   - os meus personagens
//   - as novidades (o que entrou por último no site)
//   - o convite da Comunidade (só HTML, sem JavaScript)

// VISUAL: as fotos do banner (as <img class="banner-foto"> do inicio.html) e qual está aparecendo
var fotosBanner = document.querySelectorAll('.banner-foto')
var fotoAtual = 0

if(verificarLogin()){
    carregarMinhaFoto()
    carregarOficiais()
    carregarFichas()
    carregarNovidades()
    comecarBanner()

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
// VISUAL: BANNER COM AS FOTOS DA EQUIPE (só front, não usa o servidor)
// =====================================================
// As fotos estão na variável "fotosBanner" (lá em cima).
// Mostrar uma foto = colocar a classe "on" nela e tirar das outras
// (o CSS faz a foto aparecer devagar). A cada 5 segundos passa para a próxima.
function comecarBanner(){
    var pontos = ''

    // um tracinho para cada foto; clicar num tracinho mostra aquela foto
    for(var i = 0; i < fotosBanner.length; i++){
        pontos += '<i onclick="mostrarFoto(' + i + ')"></i>'
    }

    document.getElementById('bannerPontos').innerHTML = pontos

    mostrarFoto(0)

    // setInterval: repete a função a cada 5000 milissegundos (5 segundos)
    setInterval(function(){
        var proxima = fotoAtual + 1

        if(proxima >= fotosBanner.length){
            proxima = 0
        }

        mostrarFoto(proxima)
    }, 5000)
}

// numero: qual foto mostrar (0 é a primeira)
function mostrarFoto(numero){
    var pontos = document.querySelectorAll('#bannerPontos i')

    fotoAtual = numero

    for(var i = 0; i < fotosBanner.length; i++){
        fotosBanner[i].classList.toggle('on', i == numero)
        pontos[i].classList.toggle('on', i == numero)
    }
}


// =====================================================
// CAMPANHAS OFICIAIS (do lado do banner)
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

        // VISUAL: o quadro "Criar ficha" com a estrela
        html += `
            <a class="criar-ficha" href="criar-ficha.html">
                <span>✦</span>
                <b>Criar ficha</b>
                <small>na Oficina</small>
            </a>`

        document.getElementById('filaCartas').innerHTML = html
    })
}


// =====================================================
// NOVIDADES NA PEAK
// =====================================================
// As listas do servidor vêm em ordem de id (order by id no SQL),
// então a ÚLTIMA de cada lista é a que entrou por último.
// São 3 buscas, uma depois da outra; no fim desenha os 3 cards.
function carregarNovidades(){
    buscar('/racas', function(racas){
        buscar('/monstros', function(monstros){
            buscar('/classes', function(classes){

                var html = ''

                if(racas.length > 0){
                    var r = racas[racas.length - 1]
                    html += htmlNovidade(r.imagem, r.nome, 'Nova raça', 'já está na Oficina', 'racas.html')
                }

                if(monstros.length > 0){
                    var m = monstros[monstros.length - 1]
                    html += htmlNovidade(m.imagem, m.nome, 'Bestiário', 'vida ' + m.vidaMaxima + ' · defesa ' + m.defesa, 'monstros.html')
                }

                if(classes.length > 0){
                    var cl = classes[classes.length - 1]
                    html += htmlNovidade(cl.imagem, cl.nome, 'Classe', 'para a sua ficha', 'classes.html')
                }

                document.getElementById('novidades').innerHTML = html
            })
        })
    })
}

// Um card de novidade: foto, selo, nome e um texto pequeno
function htmlNovidade(imagem, nome, tipo, texto, link){
    return `
        <a class="foto-card novidade" href="${link}">
            ${htmlFoto(imagem, nome)}
            <div class="nome">
                <span class="selo">${tipo}</span>
                <b>${seguro(nome)}</b>
                <small>${seguro(texto)}</small>
            </div>
        </a>`
}
