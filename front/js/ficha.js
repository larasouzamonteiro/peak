// ficha.js  (página ficha.html?id=3)
// Mostra UMA ficha completa. Se a ficha for de quem está logado, dá para editar e excluir.

// o id da ficha vem do endereço: ficha.html?id=3
var fichaId = parametro('id')
var ficha = null     // a ficha que veio do servidor (guardada para preencher o formulário de edição)

if(verificarLogin()){
    carregarFicha()
    carregarItens()
}

// Preenche os pedaços da ficha no HTML. Cada linha abaixo escreve em um id do ficha.html.
function carregarFicha(){
    buscar('/ficha?id=' + fichaId, function(dados){

        if(dados.hasOwnProperty('error')){
            alert(dados.error)
            window.location.href = 'fichas.html'
            return
        }

        ficha = dados

        document.getElementById('fichaNome').textContent = ficha.nome
        document.getElementById('fichaNivel').textContent = 'Nível ' + ficha.nivel
        document.getElementById('fichaSub').textContent = ficha.raca + ' · ' + ficha.classe + ' · Jogador: ' + ficha.dono

        if(ficha.retrato){
            document.getElementById('fichaRetrato').src = ficha.retrato
        }

        // vida: o texto "14 / 14" e a barra (<progress>)
        document.getElementById('fichaVida').textContent = ficha.vidaAtual + ' / ' + ficha.vidaMaxima
        document.getElementById('fichaBarra').max = ficha.vidaMaxima
        document.getElementById('fichaBarra').value = ficha.vidaAtual

        document.getElementById('fichaForca').textContent = ficha.forca
        document.getElementById('fichaDestreza').textContent = ficha.destreza
        document.getElementById('fichaConstituicao').textContent = ficha.constituicao
        document.getElementById('fichaInteligencia').textContent = ficha.inteligencia
        document.getElementById('fichaSabedoria').textContent = ficha.sabedoria
        document.getElementById('fichaCarisma').textContent = ficha.carisma

        document.getElementById('fichaPersonalidade').textContent = ficha.personalidade || 'Ainda não escreveu.'
        document.getElementById('fichaHistoria').textContent = ficha.historia || 'Ainda não escreveu.'

        document.getElementById('fichaRacaTitulo').textContent = 'Raça: ' + ficha.raca
        document.getElementById('fichaRacaDescricao').textContent = ficha.racaDescricao
        document.getElementById('fichaClasseTitulo').textContent = 'Classe: ' + ficha.classe
        document.getElementById('fichaClasseDescricao').textContent = ficha.classeDescricao

        // os botões Editar e Excluir só aparecem para o dono
        if(ficha.usuarioId == pegarUsuarioLogado().id){
            document.getElementById('botoesDono').classList.remove('oculto')

            // quem chegou pelo botão Editar da lista (ficha.html?id=3&editar=sim) já vê o formulário aberto
            if(parametro('editar') == 'sim'){
                abrirEdicao()
            }
        }
    })
}

// Os itens que a ficha carrega. Vão para <div id="fichaItens">.
function carregarItens(){
    buscar('/ficha/itens?id=' + fichaId, function(itens){
        var html = ''

        for(var i = 0; i < itens.length; i++){
            html += `
                <div class="folha-item">
                    <img src="${seguro(itens[i].imagem)}" alt="">
                    <span><strong>${seguro(itens[i].nome)}</strong><small>${seguro(itens[i].tipo)}</small></span>
                </div>`
        }

        if(html == ''){
            html = '<p class="texto-suave">Nenhum item.</p>'
        }

        document.getElementById('fichaItens').innerHTML = html
    })
}

// Mostra o formulário de edição já preenchido com os valores de agora
function abrirEdicao(){
    document.getElementById('nivel').value = ficha.nivel
    document.getElementById('vidaMaxima').value = ficha.vidaMaxima
    document.getElementById('vidaAtual').value = ficha.vidaAtual
    document.getElementById('forca').value = ficha.forca
    document.getElementById('destreza').value = ficha.destreza
    document.getElementById('constituicao').value = ficha.constituicao
    document.getElementById('inteligencia').value = ficha.inteligencia
    document.getElementById('sabedoria').value = ficha.sabedoria
    document.getElementById('carisma').value = ficha.carisma
    document.getElementById('personalidade').value = ficha.personalidade
    document.getElementById('historia').value = ficha.historia
    document.getElementById('alert').textContent = ''

    abrirJanela('caixaEdicao')
    document.getElementById('caixaEdicao').scrollIntoView()
}

function salvarFicha(){
    var mudancas = {
        id: fichaId,
        nivel: document.getElementById('nivel').value,
        vidaMaxima: document.getElementById('vidaMaxima').value,
        vidaAtual: document.getElementById('vidaAtual').value,
        forca: document.getElementById('forca').value,
        destreza: document.getElementById('destreza').value,
        constituicao: document.getElementById('constituicao').value,
        inteligencia: document.getElementById('inteligencia').value,
        sabedoria: document.getElementById('sabedoria').value,
        carisma: document.getElementById('carisma').value,
        personalidade: document.getElementById('personalidade').value.trim(),
        historia: document.getElementById('historia').value.trim()
    }

    enviar('/fichas/atualizar', mudancas, function(dados){

        if(dados.hasOwnProperty('error')){
            document.getElementById('alert').textContent = dados.error
            return
        }

        // abre a página de novo (sem o "&editar=sim") para mostrar os valores salvos
        window.location.href = 'ficha.html?id=' + fichaId
    })
}

function excluirFicha(){
    // no banco a ficha sai junto das campanhas (ON DELETE CASCADE), então avisa antes
    if(!confirm('Excluir esta ficha? Se ela estiver em alguma campanha, ela sai da campanha também.')){
        return
    }

    enviar('/fichas/excluir', {id: fichaId}, function(dados){

        if(dados.hasOwnProperty('error')){
            alert(dados.error)
            return
        }

        window.location.href = 'fichas.html'
    })
}
