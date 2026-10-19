// Email.js
// Envia o código de confirmação do cadastro, usando a biblioteca nodemailer.
// (nodemailer não foi visto em aula: é a biblioteca mais usada para mandar e-mail pelo Node)

const nodemailer = require('nodemailer')
const emailConfig = require('./emailConfig')

class Email{

    // Monta o HTML do e-mail: simples, só texto e o código em destaque.
    static montarEmail(codigo){
        var html = ''

        html += '<div style="font-family:Arial,Helvetica,sans-serif; font-size:14px; color:#222">'
        html += '<p>Olá!</p>'
        html += '<p>Seu código de confirmação da Peak é:</p>'
        html += '<p style="font-size:26px; font-weight:bold; letter-spacing:6px; margin:24px 0">' + codigo + '</p>'
        html += '<p>Use esse código para confirmar seu e-mail. Se não foi você que pediu, é só ignorar este e-mail.</p>'
        html += '</div>'

        return html
    }

    // destino: e-mail de quem se cadastrou
    // codigo:  os 6 números que a pessoa vai digitar na página
    static enviarCodigo(destino, codigo){

        // VERSÃO SERVIDOR: com o Brevo configurado, manda por ele
        if(emailConfig.brevoChave != '' && emailConfig.remetente != ''){
            Email.enviarPeloBrevo(destino, codigo)
            return
        }

        // sem conta configurada: mostra o código no terminal (serve para testar)
        if(emailConfig.email == '' || emailConfig.senha == ''){
            console.log('Código de confirmação de ' + destino + ': ' + codigo)
            return
        }

        // "transporter" é quem entrega o e-mail (aqui, a conta do Gmail).
        // O e-mail e a senha de app vêm do emailConfig.js (nunca escreva a senha aqui).
        // family: 4 força IPv4, para evitar o erro ENETUNREACH (IPv6) de algumas redes.
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
            subject: 'Seu código da Peak: ' + codigo,
            text: 'Olá! Seu código de confirmação da Peak é: ' + codigo,
            html: Email.montarEmail(codigo)
        }

        transporter.sendMail(mensagem, (error, info)=>{
            if(error){
                // se o envio falhar, o código aparece no terminal para o cadastro não travar
                console.log('Não consegui enviar o e-mail:', error.message)
                console.log('Código de confirmação de ' + destino + ': ' + codigo)
                return
            }

            console.log('E-mail enviado com sucesso para ' + destino)
        })
    }
}


// VERSÃO SERVIDOR: manda o e-mail pela internet (HTTPS) usando o Brevo,
// porque o Render grátis bloqueia o jeito do Gmail (SMTP).
Email.enviarPeloBrevo = function(destino, codigo){
    fetch('https://api.brevo.com/v3/smtp/email', {
        method: 'POST',
        headers: {
            'api-key': emailConfig.brevoChave,
            'Content-Type': 'application/json'
        },
        body: JSON.stringify({
            sender: {name: 'Peak', email: emailConfig.remetente},
            to: [{email: destino}],
            subject: 'Seu código da Peak: ' + codigo,
            htmlContent: Email.montarEmail(codigo),
            textContent: 'Olá! Seu código de confirmação da Peak é: ' + codigo
        })
    })
    .then((resposta) => {
        if(resposta.ok){
            console.log('E-mail enviado (Brevo) para ' + destino)
        }else{
            resposta.text().then((texto) => console.log('O Brevo recusou o e-mail:', texto))
        }
    })
    .catch((erro) => console.log('Não consegui falar com o Brevo:', erro.message))
}

module.exports = Email
