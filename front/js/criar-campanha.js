// criar-campanha.js  (página criar-campanha.html)
// Quem cria a campanha vira o Mestre dela.

verificarLogin()

var campanhaCriada = null      // o id da campanha que acabou de ser criada

function criarCampanha(){

    // primeiro lê a imagem de capa (se a pessoa escolheu uma); quando terminar, manda tudo
    lerImagem(document.getElementById('capa'), function(imagem){

        var campanha = {
            nome: document.getElementById('nome').value.trim(),
            descricao: document.getElementById('descricao').value.trim(),
            historia: document.getElementById('historia').value.trim(),
            imagemCapa: imagem
        }

        enviar('/campanhas/criar', campanha, function(dados){

            if(dados.hasOwnProperty('error')){
                document.getElementById('alert').textContent = dados.error
                return
            }

            // mostra o código numa janela que só fecha quando a pessoa clicar
            campanhaCriada = dados.id
            document.getElementById('codigoCriado').textContent = dados.codigo
            abrirJanela('janelaCodigo')
        })
    })
}

// "Copiar código": coloca o código na área de transferência (o Ctrl+C do navegador)
function copiarCodigo(){
    var codigo = document.getElementById('codigoCriado').textContent

    navigator.clipboard.writeText(codigo)
    avisar('Código copiado!', codigo, 'certo')
}

function irParaCampanha(){
    window.location.href = 'campanha.html?id=' + campanhaCriada
}
