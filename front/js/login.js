// login.js  (páginas login.html e confirmar.html)
// Entrar, criar a conta e confirmar o código que chegou no e-mail.
// No login.html ficam os dois formulários (login e cadastro) dentro da mesma caixa.
// O "esqueci minha senha" (nova-senha.html) tem arquivo próprio: js/nova-senha.js.

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

// Tecla Enter: os inputs do login.html e do confirmar.html chamam apertouEnter()
// (está no script.js) para o Enter fazer o mesmo que o botão.

// ---------- LOGIN (login.html) ----------
function login(){
    var usuario = document.getElementById('nomeUsuario').value.trim()
    var senha = document.getElementById('senha').value

    document.getElementById('alert').textContent = ''

    enviar('/login', {nomeUsuario: usuario, senha: senha}, function(dados){

        if(dados.hasOwnProperty('error')){

            // a conta existe, mas o e-mail ainda não foi confirmado: vai para a página do código
            if(dados.confirmar){
                // encodeURIComponent: um e-mail com "+" (ex.: a+b@x.com) chegaria
                // no confirmar.html com espaço no lugar do "+" e o código daria errado
                avisar('Confirme o seu e-mail', dados.error, 'info', function(){
                    window.location.href = 'confirmar.html?email=' + encodeURIComponent(dados.email)
                })
                return
            }

            document.getElementById('alert').textContent = dados.error
            document.getElementById('senha').value = ''
            return
        }

        // guarda quem entrou e o token: as outras páginas usam os dois
        localStorage.setItem('usuarioLogado', JSON.stringify(dados.usuario))
        localStorage.setItem('token', dados.token)

        // se a pessoa chegou aqui por um link (ex.: o perfil de alguém), volta para ele;
        // senão vai para o Início. (quem guarda o link é o verificarLogin do script.js)
        var destino = sessionStorage.getItem('voltarPara') || 'inicio.html'
        sessionStorage.removeItem('voltarPara')

        window.location.href = destino
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

        // encodeURIComponent: mesmo motivo do login (o "+" do e-mail não pode virar espaço)
        avisar(dados.message, 'Levando você para confirmar o e-mail…', 'certo', function(){
            window.location.href = 'confirmar.html?email=' + encodeURIComponent(email)
        })
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

        avisar(resposta.message, 'Levando você para o login…', 'certo', function(){
            window.location.href = 'login.html'
        })
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
