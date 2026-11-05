// criar-campanha.js  (página criar-campanha.html)
// Quem cria a campanha vira o Mestre dela.

verificarLogin()

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

            // a mensagem já traz o código de convite
            avisar(dados.message, 'Levando você para a campanha…', 'certo', function(){
                window.location.href = 'campanha.html?id=' + dados.id
            })
        })
    })
}
