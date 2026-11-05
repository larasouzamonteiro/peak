// tutorial.js  (usado só no inicio.html)
// Tutorial da Zero: aparece na primeira vez que a pessoa entra.
// A Zero fala numa caixa embaixo da tela, e o item do menu que ela está
// explicando fica aceso (ganha a classe "tut-destaque").
//
// Quando a pessoa termina ou pula, o servidor grava tutorialVisto = 1
// na tabela usuarios e o tutorial não aparece mais.
// Para ver de novo: Configurações > Ver tutorial de novo (abre inicio.html?tutorial=sim).

// Cada fala: o texto e qual link do menu fica aceso
// (alvo = o href do link, ex.: 'fichas.html'. Vazio = nenhum.)
var falas = [
    {alvo: '', texto: 'Olá! Eu sou a Zero. É a sua primeira vez por aqui, né? Deixa eu te mostrar como a Peak funciona antes da sua primeira aventura.'},
    {alvo: 'inicio.html', texto: 'Este é o Início, a primeira tela que você vê. Aqui ficam os avisos da Peak, os seus personagens e as novidades do site.'},
    {alvo: 'fichas.html', texto: 'Em Fichas você cria personagens na Oficina: identidade, raça, classe, combate, itens, atributos e história. Também dá para inventar as suas próprias raças e classes.'},
    {alvo: 'campanhas.html', texto: 'Em Campanhas você vê as suas mesas, cria uma nova ou entra na de um amigo com o código de convite. Se for o Mestre, lá também ficam as sessões e o mapa com sons.'},
    {alvo: 'monstros.html', texto: 'O Bestiário tem os monstros da Peak, os de cada campanha oficial e os da comunidade. Você pode criar os seus e colocar nas suas campanhas.'},
    {alvo: 'comunidade.html', texto: 'Na Comunidade fica o Mural, onde você posta recados para achar grupo ou parceria. Na aba Pessoas você encontra quem tem os mesmos interesses: quem desenha, quem mestra, quem escreve.'},
    {alvo: 'historia.html', texto: 'Em História ficam os livros da Peak: como jogar, o que é RPG, as campanhas oficiais e a história da nossa equipe.'},
    {alvo: 'perfil.html?aba=configuracoes', texto: 'Aqui embaixo ficam o seu perfil e as configurações: foto, capa, "sobre mim", contato, interesses, parcerias e o modo escuro.'},
    {alvo: '', texto: 'Pronto, agora é com você! Crie a sua primeira ficha, chame os seus amigos e boa aventura!'}
]

var falaAtual = 0

// Mostra a caixa do tutorial (<div id="tutorial">) e começa pela primeira fala
function abrirTutorial(){
    document.getElementById('tutorial').classList.remove('oculto')

    // enquanto o tutorial está aberto, o menu fica apagado, menos o item em destaque
    document.querySelector('.lateral').classList.add('tut-ativo')

    mostrarFala(0)
}

// Escreve a fala em <p id="tutTexto">, o contador em <span id="tutContador">
// e acende o link do menu daquela fala
function mostrarFala(numero){
    falaAtual = numero

    var fala = falas[numero]

    document.getElementById('tutTexto').textContent = fala.texto
    document.getElementById('tutContador').textContent = (numero + 1) + ' de ' + falas.length

    // tira o destaque de todos os links e coloca só no link desta fala
    var links = document.querySelectorAll('.lateral-link')

    var destaque = null

    for(var i = 0; i < links.length; i++){
        links[i].classList.toggle('tut-destaque', fala.alvo != '' && links[i].getAttribute('href') == fala.alvo)

        if(fala.alvo != '' && links[i].getAttribute('href') == fala.alvo){
            destaque = links[i]
        }
    }

    mostrarItemNoCelular(destaque)

    // na última fala o botão vira "Terminar" e o "Pular" some
    var ultima = (numero == falas.length - 1)

    document.getElementById('tutProximo').textContent = ultima ? 'Terminar' : 'Próximo ›'
    document.getElementById('tutPular').classList.toggle('oculto', ultima)
}

// VISUAL (celular): na barra de baixo só aparecem Início, Campanhas, Fichas e o "Mais".
// Bestiário, Comunidade e Configurações ficam escondidos dentro do "Mais".
// Então, se o item da fala está escondido, o tutorial abre o "Mais" (abrirMais do script.js)
// e fecha de novo quando a fala seguinte não precisar dele.
var tutAbriuMais = false

function mostrarItemNoCelular(link){
    var lateral = document.querySelector('.lateral')

    // fecha o "Mais" que o próprio tutorial abriu na fala anterior
    if(tutAbriuMais && lateral.classList.contains('mais-aberto')){
        abrirMais()
    }
    tutAbriuMais = false

    // offsetParent == null quer dizer que o link está escondido (display: none)
    if(link != null && link.offsetParent == null && window.innerWidth <= 760){
        abrirMais()
        tutAbriuMais = true
        link.scrollIntoView({block: 'nearest'})
    }

    // a caixa da Zero fica embaixo; se o item aceso estiver na metade de baixo
    // da tela (ex.: Configurações no "Mais"), a caixa sobe para o topo e não cobre o item
    var caixaEmCima = false

    if(link != null && tutAbriuMais){
        caixaEmCima = link.getBoundingClientRect().top > window.innerHeight / 2
    }

    document.getElementById('tutorial').classList.toggle('caixa-em-cima', caixaEmCima)
}

function proximaFala(){
    if(falaAtual == falas.length - 1){
        terminarTutorial()
    }else{
        mostrarFala(falaAtual + 1)
    }
}

// Fecha o tutorial e avisa o servidor que a pessoa já viu
function terminarTutorial(){
    document.getElementById('tutorial').classList.add('oculto')
    document.querySelector('.lateral').classList.remove('tut-ativo')

    var links = document.querySelectorAll('.lateral-link')

    for(var i = 0; i < links.length; i++){
        links[i].classList.remove('tut-destaque')
    }

    mostrarItemNoCelular(null)      // fecha o "Mais" se o tutorial abriu

    enviar('/tutorial/visto', {}, function(dados){

        // guarda também no navegador, para não abrir de novo ao voltar para o Início
        var usuario = pegarUsuarioLogado()

        usuario.tutorialVisto = 1
        localStorage.setItem('usuarioLogado', JSON.stringify(usuario))
    })
}
