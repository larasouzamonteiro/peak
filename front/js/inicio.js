// inicio.js  (página inicio.html)
// A primeira tela depois do login:
//   - o aviso da equipe da Peak (no topo)
//   - o banner com as fotos da equipe e as campanhas oficiais
//   - os meus personagens
//   - as novidades (o que entrou por último no site)
//   - o convite da Comunidade (só HTML, sem JavaScript)
//
// ORGANIZAÇÃO: primeiro as partes que buscam dados no servidor; a parte só VISUAL
// (o banner que passa sozinho) fica no fim. O presente do evento está no evento.js.

// O BANNER: os <img>/<video> com a classe "banner-foto" do inicio.html
var fotosBanner = []        // os banners que estão passando agora (os normais ou os de Natal)
var bannerDeNatal = null    // true = passando os de Natal; false = os normais
var fotoAtual = 0

if(verificarLogin()){
    carregarMinhaFoto()
    carregarAvisos()
    carregarOficiais()
    carregarFichas()
    carregarNovidades()
    comecarBanner()
    carregarEvento()
    setInterval(carregarEvento, 30000) //cada 30 segundos confere de novo

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

        // sem foto: a foto padrão (fotoDePerfil, do script.js)
        lugar.innerHTML = '<img src="' + seguro(fotoDePerfil(pessoa.fotoPerfil)) + '" alt="">'
    })
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
                    ${htmlFoto(o.imagemCapa, 'campanha')}
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
// AVISOS DA PEAK (a linha do topo e a janelinha)
// =====================================================
// O admin posta os avisos na Administração. Aqui:
//   - o mais novo aparece numa linha no topo (<a id="avisoTopo">)
//   - clicando nela, abre a janelinha com os 3 últimos (<div id="avisosJanela">)
// O servidor já manda o mais novo primeiro (order by id desc).
function carregarAvisos(){
    buscar('/avisos', function(avisos){
        // sem aviso (ou deu erro): a linha do topo continua escondida
        if(avisos.hasOwnProperty('error') || avisos.length == 0){
            return
        }

        document.getElementById('avisoTitulo').textContent = avisos[0].titulo
        document.getElementById('avisoData').textContent = '· ' + dataCurta(avisos[0].criadoEm)
        document.getElementById('avisoTopo').classList.remove('oculto')

        var html = '<h4>Avisos da Peak</h4>'

        for(var i = 0; i < avisos.length; i++){
            html += `
                <div class="aviso-item">
                    <b>${seguro(avisos[i].titulo)}</b>
                    <p>${seguro(avisos[i].texto)}</p>
                    <small>${dataCurta(avisos[i].criadoEm)}</small>
                </div>`
        }

        document.getElementById('avisosJanela').innerHTML = html
    })
}

// abre e fecha a janelinha dos avisos
function abrirAvisos(){
    document.getElementById('avisosJanela').classList.toggle('oculto')
}

// "2026-11-03T..." -> "3 nov"
function dataCurta(texto){
    var meses = ['jan', 'fev', 'mar', 'abr', 'mai', 'jun', 'jul', 'ago', 'set', 'out', 'nov', 'dez']
    var data = new Date(texto)

    return data.getDate() + ' ' + meses[data.getMonth()]
}


// =====================================================
// SEUS PERSONAGENS
// =====================================================
// A fila tem um número de "espaços" que depende do tamanho da tela:
//   tela grande -> 5 espaços | notebook -> 4 | tela pequena -> 3
// Nos espaços entram: as fichas (a MAIS NOVA primeiro), depois a carta
// "Nova ficha" (sempre aparece) e, se ainda sobrar espaço, as vagas livres.
function carregarFichas(){
    buscar('/fichas', function(fichas){
        // VISUAL: quantos espaços cabem na fila (o CSS usa as mesmas larguras)
        var espacos = 5

        if(window.innerWidth < 1400){
            espacos = 4
        }

        if(window.innerWidth <= 1100){
            espacos = 3
        }

        var html = ''
        var usados = 0

        // a lista vem do servidor em ordem de id (a mais antiga primeiro),
        // então começamos do FIM da lista para a mais nova vir na frente.
        // O "espacos - 1" guarda 1 espaço para a carta "Nova ficha".
        for(var i = fichas.length - 1; i >= 0 && usados < espacos - 1; i--){
            html += htmlCarta(fichas[i], '')
            usados++
        }

        // a carta "Nova ficha" aparece sempre
        html += `
            <a class="criar-ficha" href="criar-ficha.html">
                <img class="criar-foto" src="../img/criar/nova-ficha.jpg" alt="">
                <span class="criar-mais">+</span>
                <b>Nova ficha</b>
                <small>criar na Oficina</small>
            </a>`
        usados++

        // VISUAL: as vagas livres completam a fila (só quando tem poucas fichas)
        while(usados < espacos){
            html += `
                <a class="vaga-livre" href="criar-ficha.html">
                    <span class="criar-mais">+</span>
                    <small>vaga livre</small>
                </a>`
            usados++
        }

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
                    html += htmlNovidade(r.imagem, r.nome, 'Nova raça', 'já está na Oficina', 'racas.html',r)
                }

                if(monstros.length > 0){
                    var m = monstros[monstros.length - 1]
                    html += htmlNovidade(m.imagem, m.nome, 'Bestiário', 'vida ' + m.vidaMaxima + ' · defesa ' + m.defesa, 'monstros.html',m)
                }

                if(classes.length > 0){
                    var cl = classes[classes.length - 1]
                    html += htmlNovidade(cl.imagem, cl.nome, 'Classe', 'para a sua ficha', 'classes.html',cl)
                }

                document.getElementById('novidades').innerHTML = html
            })
        })
    })
}


function htmlNovidade(imagem, nome, tipo, texto, link, item){
    // VISUAL: a novidade de evento (ex.: Natal) ganha a classe "card-evento", a neve e o "Tempo limitado"
    var classeCard = 'foto-card novidade'
    var extras = ''
    var prazo = ''

    if(item.tema){
        classeCard += ' card-evento'
        prazo = '<span class="prazo-evento">Tempo limitado</span>'

        // o NOVO só nos 7 primeiros dias do evento
        if(item.novo > 0){
            extras += '<span class="selo-novo">NOVO</span>'
        }
    }

    // qual foto padrão usar, se não tiver imagem (o link diz se é raça, classe ou monstro)
    var qual = 'monstro'

    if(link == 'racas.html'){
        qual = 'raca'
    }else if(link == 'classes.html'){
        qual = 'classe'
    }

    return `
        <a class="${classeCard}" href="${link}">
            ${extras}
            ${htmlFoto(imagem, qual)}
            <div class="nome">
                <span class="selo">${tipo}</span>
                <b>${seguro(nome)}</b>
                <small>${seguro(texto)}</small>
            </div>
            ${prazo}
        </a>`
}


// =====================================================
// VISUAL: O BANNER (só front, não usa o servidor)
// =====================================================
// Mostrar um banner = colocar a classe "on" nele e tirar dos outros
// (o CSS faz ele aparecer devagar). A cada 5 segundos passa para o próximo.
function comecarBanner(){
    escolherBanners(false)

    // setInterval: repete a função a cada 5000 milissegundos (5 segundos)
    setInterval(function(){
        var proxima = fotoAtual + 1

        if(proxima >= fotosBanner.length){
            proxima = 0
        }

        mostrarFoto(proxima)
    }, 5000)
}

// natal: true = passam só os banners com a classe "natal"; false = só os outros
function escolherBanners(natal){
    // já está passando esses: não precisa mudar
    if(natal == bannerDeNatal){
        return
    }

    // no Natal, mas sem nenhum banner de Natal no HTML: continuam os normais
    if(natal && document.querySelectorAll('#bannerFotos .natal').length == 0){
        natal = false
    }

    bannerDeNatal = natal

    // VISUAL: no Natal o banner ganha a mesma decoração das cartas do evento
    // (borda de bengala doce e brilho dourado: está no style.css, "EVENTO DE NATAL").
    // A neve de dentro das cartas não entra aqui: o site inteiro já tem neve caindo.
    if(natal){
        document.querySelector('.destaque-grande').classList.add('card-evento')
    }else{
        document.querySelector('.destaque-grande').classList.remove('card-evento')
    }

    // apaga todos; depois só os escolhidos vão acender
    var todos = document.querySelectorAll('.banner-foto')

    for(var i = 0; i < todos.length; i++){
        todos[i].classList.remove('on')
    }

    if(natal){
        fotosBanner = document.querySelectorAll('.banner-foto.natal')
    }else{
        fotosBanner = document.querySelectorAll('.banner-foto:not(.natal)')
    }

    // um tracinho para cada banner; clicar num tracinho mostra aquele banner
    var pontos = ''

    for(var i = 0; i < fotosBanner.length; i++){
        pontos += '<i onclick="mostrarFoto(' + i + ')"></i>'
    }

    document.getElementById('bannerPontos').innerHTML = pontos
    mostrarFoto(0)
}

// numero: qual foto mostrar (0 é a primeira)
function mostrarFoto(numero){
    var pontos = document.querySelectorAll('#bannerPontos i')

    fotoAtual = numero

    for(var i = 0; i < fotosBanner.length; i++){
        if(i == numero){
            fotosBanner[i].classList.add('on')
        }else{
            fotosBanner[i].classList.remove('on')
        }
        if(i == numero){
            pontos[i].classList.add('on')
        }else{
            pontos[i].classList.remove('on')
        }
    }
}
