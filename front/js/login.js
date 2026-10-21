// login.js  (páginas login.html, confirmar.html e nova-senha.html)
// Entrar, criar a conta, confirmar o código que chegou no e-mail e trocar a senha esquecida.
// No login.html ficam os dois formulários (login e cadastro) dentro da mesma caixa.

// Só no login.html: o botão "criar conta" da página de propaganda abre
// login.html?cadastro=sim, e aí a caixa já começa no cadastro
// (aqui não chama mostrarCadastro() para o card já aparecer no lugar, sem animação)
if(document.getElementById('caixa') != null && parametro('cadastro') == 'sim'){
    document.body.classList.add('cadastro')
}

// Só no confirmar.html: o e-mail vem no endereço (confirmar.html?email=fulano@email.com)
if(document.getElementById('codigo') != null && parametro('email') != null){
    document.getElementById('email').value = parametro('email')
}

// ---------- LOGIN (login.html) ----------
function login(){
    var usuario = document.getElementById('nomeUsuario').value.trim()
    var senha = document.getElementById('senha').value

    document.getElementById('alert').textContent = ''

    enviar('/login', {nomeUsuario: usuario, senha: senha}, function(dados){

        if(dados.hasOwnProperty('error')){

            // a conta existe, mas o e-mail ainda não foi confirmado: vai para a página do código
            if(dados.confirmar){
                alert(dados.error)
                window.location.href = 'confirmar.html?email=' + dados.email
                return
            }

            document.getElementById('alert').textContent = dados.error
            document.getElementById('senha').value = ''
            return
        }

        // guarda quem entrou e o token: as outras páginas usam os dois
        localStorage.setItem('usuarioLogado', JSON.stringify(dados.usuario))
        localStorage.setItem('token', dados.token)

        window.location.href = 'inicio.html'
    })
}

// ---------- TROCAR ENTRE LOGIN E CADASTRO (login.html) ----------
// As duas funções só colocam ou tiram a classe "cadastro" do <body>.
// O que essa classe faz (o card ir para o outro lado, o fundo espelhar, um
// formulário sumir e o outro aparecer) está todo no css/entrada.css, na parte "MODO CADASTRO".
function mostrarCadastro(){
    document.body.classList.add('cadastro')
    inclinarCard()
}

function mostrarLogin(){
    document.body.classList.remove('cadastro')
    inclinarCard()
}

// VISUAL: enquanto o card troca de lado ele fica um pouco inclinado (efeito 3D).
// A classe "girando" liga a animação do CSS e sai depois de 900 milissegundos.
function inclinarCard(){
    var caixa = document.getElementById('caixa')

    caixa.classList.add('girando')

    setTimeout(function(){
        caixa.classList.remove('girando')
    }, 900)
}

// ---------- CADASTRO (login.html, formulário "Crie sua conta") ----------
function cadastrar(){
    var nome = document.getElementById('nomeCadastro').value.trim()
    var email = document.getElementById('emailCadastro').value.trim()
    var senha = document.getElementById('senhaCadastro').value
    var senha2 = document.getElementById('senha2Cadastro').value
    var telefone = document.getElementById('telefoneCadastro').value.trim()

    if(senha != senha2){
        document.getElementById('alertCadastro').textContent = 'Senhas não conferem'
        document.getElementById('senhaCadastro').value = ''
        document.getElementById('senha2Cadastro').value = ''
        return
    }

    enviar('/registro', {nomeUsuario: nome, email: email, senha: senha, telefone: telefone}, function(dados){

        if(dados.hasOwnProperty('error')){
            document.getElementById('alertCadastro').textContent = dados.error
            return
        }

        alert(dados.message)
        window.location.href = 'confirmar.html?email=' + email
    })
}

// ---------- CÓDIGO DO E-MAIL (confirmar.html) ----------
function confirmar(){
    var dados = {
        email: document.getElementById('email').value.trim(),
        codigo: document.getElementById('codigo').value.trim()
    }

    enviar('/registro/confirmar', dados, function(resposta){

        if(resposta.hasOwnProperty('error')){
            document.getElementById('alert').textContent = resposta.error
            return
        }

        alert(resposta.message)
        window.location.href = 'login.html'
    })
}

// Pede um código novo
function reenviar(){
    var email = document.getElementById('email').value.trim()

    enviar('/registro/reenviar', {email: email}, function(resposta){

        if(resposta.hasOwnProperty('error')){
            document.getElementById('alert').textContent = resposta.error
            return
        }

        document.getElementById('alert').textContent = resposta.message
    })
}


// ---------- ESQUECI MINHA SENHA (nova-senha.html) ----------
// Passo 1: manda o e-mail. O servidor guarda um código e manda por e-mail (Brevo).
function pedirCodigoSenha(){
    var email = document.getElementById('emailSenha').value.trim()

    document.getElementById('alertPedir').textContent = ''

    enviar('/senha/pedir', {email: email}, function(resposta){

        if(resposta.hasOwnProperty('error')){
            document.getElementById('alertPedir').textContent = resposta.error
            document.getElementById('alertTrocar').textContent = resposta.error
            return
        }

        // esconde o passo 1 e mostra o passo 2
        document.getElementById('emailMostrado').textContent = email
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
