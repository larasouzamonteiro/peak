

const nodemailer = require('nodemailer')
const emailConfig = require('./emailConfig')

class Email{

    static montarEmail(codigo, tipo){
        var html = ''

        // a frase muda conforme o motivo do código
        var frase = 'Use esse código para confirmar seu e-mail.'
        if(tipo == 'senha'){
            frase = 'Use este código para trocar a sua senha.'
        }

        html += '<div style="font-family:Arial,Helvetica,sans-serif; font-size:14px; color:#222">'
        html += '<p>Olá!</p>'
        html += '<p>Seu código da Peak é:</p>'
        html += '<p style="font-size:26px; font-weight:bold; letter-spacing:6px; margin:24px 0">' + codigo + '</p>'
        html += '<p>' + frase + ' Se não foi você que pediu, é só ignorar este e-mail.</p>'
        html += '</div>'

        return html
    }

    static enviarCodigo(destino, codigo, tipo, depois){

        // assunto do e-mail: muda quando é para trocar a senha
        var assunto = 'Seu código da Peak: ' + codigo
        if(tipo == 'senha'){
            assunto = 'Código para trocar a sua senha da Peak: ' + codigo
        }

        // VERSÃO SERVIDOR: com o Brevo configurado, manda por ele
        if(emailConfig.brevoChave != '' && emailConfig.remetente != ''){
            Email.enviarPeloBrevo(destino, codigo, assunto, tipo, depois)
            return
        }

        // sem conta configurada: mostra o código no terminal (serve para testar)
        if(emailConfig.email == '' || emailConfig.senha == ''){
            console.log('Código de confirmação de ' + destino + ': ' + codigo)
            terminar(depois)
            return
        }

      
        const transporter = nodemailer.createTransport({
            host: 'smtp.gmail.com',
            port: 587,
            secure: false,
            family: 4,
            auth: {
                user: emailConfig.email,
                pass: emailConfig.senha
            }
        })

        var mensagem = {
            from: 'Peak <' + emailConfig.email + '>',
            to: destino,
            subject: assunto,
            text: 'Olá! Seu código da Peak é: ' + codigo,
            html: Email.montarEmail(codigo, tipo)
        }

        transporter.sendMail(mensagem, (error, info)=>{
            if(error){
                // se o envio falhar, o código aparece no terminal para o cadastro não travar
                console.log('Não consegui enviar o e-mail:', error.message)
                console.log('Código de confirmação de ' + destino + ': ' + codigo)
                terminar(depois)
                return
            }

            console.log('E-mail enviado com sucesso para ' + destino)
            terminar(depois)
        })
    }
}


// VERSÃO SERVIDOR: manda o e-mail pela internet (HTTPS) usando o Brevo,
// porque o Render grátis bloqueia o jeito do Gmail (SMTP).
Email.enviarPeloBrevo = function(destino, codigo, assunto, tipo, depois){
    fetch('https://api.brevo.com/v3/smtp/email', {
        method: 'POST',
        headers: {
            'api-key': emailConfig.brevoChave,
            'Content-Type': 'application/json'
        },
        body: JSON.stringify({
            sender: {name: 'Peak', email: emailConfig.remetente},
            to: [{email: destino}],
            subject: assunto,
            htmlContent: Email.montarEmail(codigo, tipo),
            textContent: 'Olá! Seu código da Peak é: ' + codigo
        })
    })
    .then((resposta) => {
        if(resposta.ok){
            console.log('E-mail enviado (Brevo) para ' + destino)
            terminar(depois)
        }else{
            resposta.text().then((texto) => {
                console.log('O Brevo recusou o e-mail:', texto)
                terminar(depois)
            })
        }
    })
    .catch((erro) => {
        console.log('Não consegui falar com o Brevo:', erro.message)
        terminar(depois)
    })
}

// chama a função "depois" só se ela foi mandada (ela é opcional)
function terminar(depois){
    if(depois){
        depois()
    }
}

module.exports = Email
