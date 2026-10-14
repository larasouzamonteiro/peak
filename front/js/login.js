// login.js  (páginas login.html e confirmar.html)
// Entrar, criar a conta e confirmar o código que chegou no e-mail.
// No login.html ficam os dois formulários (login e cadastro) dentro da mesma caixa.

// Só no login.html: o botão "criar conta" da página de propaganda abre
// login.html?cadastro=sim, e aí a caixa já começa no cadastro
if(document.getElementById('caixa') != null && parametro('cadastro') == 'sim'){
    mostrarCadastro()
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
// As duas funções só colocam ou tiram a classe "cadastro" de <div class="entrada-caixa" id="caixa">.
// O que essa classe faz (as metades trocarem de lado, um formulário sumir e o outro
// aparecer) está todo no css/entrada.css, na parte "MODO CADASTRO".
function mostrarCadastro(){
    document.getElementById('caixa').classList.add('cadastro')
}

function mostrarLogin(){
    document.getElementById('caixa').classList.remove('cadastro')
}

// ---------- CADASTRO (login.html, formulário "Crie sua conta") ----------
function cadastrar(){
    var nome = document.getElementById('nomeCadastro').value.trim()
    var email = document.getElementById('emailCadastro').value.trim()
    var senha = document.getElementById('senhaCadastro').value
    var senha2 = document.getElementById('senha2Cadastro').value

    if(senha != senha2){
        document.getElementById('alertCadastro').textContent = 'Senhas não conferem'
        document.getElementById('senhaCadastro').value = ''
        document.getElementById('senha2Cadastro').value = ''
        return
    }

    enviar('/registro', {nomeUsuario: nome, email: email, senha: senha}, function(dados){

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
