// nova-senha.js  (página nova-senha.html)
// "Esqueci minha senha": pede o código (por e-mail ou SMS) e troca a senha.
// Este arquivo é carregado só pelo nova-senha.html (o login.js cuida do login e do cadastro).

// ---------- ESQUECI MINHA SENHA (nova-senha.html) ----------
// por onde o código vai: 'email' ou 'sms' (muda nos botões E-mail | SMS)
var via = 'email'

function escolherVia(escolha){
    via = escolha
    document.getElementById('viaEmail').classList.toggle('ativo', via == 'email')
    document.getElementById('viaSms').classList.toggle('ativo', via == 'sms')
}

// Passo 1: manda o e-mail e a escolha. O servidor guarda um código e manda
// por SMS (se escolheu SMS e a conta tem celular) ou por e-mail (Brevo).
function pedirCodigoSenha(){
    var email = document.getElementById('emailSenha').value.trim()

    document.getElementById('alertPedir').textContent = ''

    enviar('/senha/pedir', {email: email, via: via}, function(resposta){

        if(resposta.hasOwnProperty('error')){
            document.getElementById('alertPedir').textContent = resposta.error
            document.getElementById('alertTrocar').textContent = resposta.error
            return
        }

        // o texto do passo 2 (seguro() porque o e-mail foi digitado pela pessoa)
        if(via == 'sms'){
            document.getElementById('ondeChegou').innerHTML = 'Se a conta <b>' + seguro(email) + '</b> tiver celular, o código chegou por SMS. Se não tiver, foi para o e-mail. Ele só vale uma vez.'
        }else{
            document.getElementById('ondeChegou').innerHTML = 'Enviamos o código para <b>' + seguro(email) + '</b>. Ele só vale uma vez.'
        }

        // esconde o passo 1 e mostra o passo 2
        document.getElementById('passoPedir').classList.add('oculto')
        document.getElementById('passoTrocar').classList.remove('oculto')
        document.getElementById('alertTrocar').textContent = ''
    })
}

// Passo 2: o código que chegou + a senha nova (duas vezes)
function trocarSenha(){
    var email = document.getElementById('emailSenha').value.trim()
    var codigo = document.getElementById('codigoSenha').value.trim()
    var senha = document.getElementById('senhaNova').value
    var senha2 = document.getElementById('senhaNova2').value

    if(senha != senha2){
        document.getElementById('alertTrocar').textContent = 'Senhas não conferem'
        document.getElementById('senhaNova').value = ''
        document.getElementById('senhaNova2').value = ''
        return
    }

    enviar('/senha/trocar', {email: email, codigo: codigo, senha: senha}, function(resposta){

        if(resposta.hasOwnProperty('error')){
            document.getElementById('alertTrocar').textContent = resposta.error
            return
        }

        alert(resposta.message)
        window.location.href = 'login.html'
    })
}
