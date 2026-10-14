// Email.js
// Envia o código de confirmação do cadastro, usando a biblioteca nodemailer.
// (nodemailer não foi visto em aula: é a biblioteca mais usada para mandar e-mail pelo Node)

const nodemailer = require('nodemailer')
const emailConfig = require('./emailConfig')

// as imagens da personagem, guardadas em texto (base64) no arquivo emailImagens.js,
// na mesma pasta. Se o arquivo não estiver lá, o e-mail vai bonito do mesmo jeito,
// só sem a personagem (o try/catch evita que o servidor pare por causa disso).
var emailImagens = null
try{
    emailImagens = require('./emailImagens')
}catch(erro){
    console.log('Aviso: emailImagens.js não encontrado, o e-mail vai sem a personagem.')
}

class Email{

    // Monta o HTML bonito do e-mail (cartão claro com a personagem no canto).
    // É tudo em <table> com o estilo dentro da tag porque Gmail e Outlook só entendem assim.
    // A personagem vem em 3 pedaços (topo, meio e base) que se encaixam em volta do cartão.
    // VERSÃO SERVIDOR: "imagens" diz de onde vêm as 3 partes da personagem.
    //   'cid'  -> anexadas no e-mail (Gmail, no computador)
    //   um endereço (https://peak.onrender.com) -> a imagem fica no próprio site (Brevo)
    static montarEmail(codigo, imagens){
        var topo = 'cid:peak-topo', meio = 'cid:peak-meio', base = 'cid:peak-base'

        if(imagens && imagens != 'cid'){
            topo = imagens + '/img/email/topo.jpg'
            meio = imagens + '/img/email/meio.jpg'
            base = imagens + '/img/email/base.jpg'
        }

        var poppins = "font-family:'Poppins',Arial,Helvetica,sans-serif;"
        var lora = "font-family:'Lora',Georgia,serif;"
        var html = ''

        // fontes do Google (o Gmail ignora; Apple Mail e iPhone usam)
        html += '<link href="https://fonts.googleapis.com/css2?family=Lora:wght@700&family=Poppins:wght@400;600;700&display=swap" rel="stylesheet">'

        // fundo areia da página inteira
        html += '<table width="100%" cellpadding="0" cellspacing="0" border="0" bgcolor="#E7DDC8" style="background:#E7DDC8">'
        html += '<tr><td align="center" style="padding:28px 0">'

        // bloco central de 600px: 3 colunas (margem 36 | texto 304 | imagem 260)
        html += '<table width="600" cellpadding="0" cellspacing="0" border="0" style="width:600px; border-collapse:collapse">'

        // linha 1: PEAK e o topo da personagem (cabeça, por cima do cartão)
        html += '<tr>'
        html += '<td width="340" colspan="2" valign="middle" style="padding:0 0 0 44px; ' + lora + ' font-size:28px; line-height:30px; font-weight:bold; letter-spacing:8px; color:#1f1b18">PEAK</td>'
        html += '<td width="260" style="font-size:0; line-height:0"><img src="' + topo + '" width="260" height="170" alt="" style="display:block; border:0"></td>'
        html += '</tr>'

        // linha 2: o cartão. A parte esquerda é a célula clara com o texto;
        // a parte direita do cartão já vem desenhada na imagem do meio.
        // A altura da linha é a da imagem (520), então o cartão fica sempre inteiro.
        html += '<tr>'
        html += '<td width="36" style="font-size:0; line-height:0">&nbsp;</td>'
        html += '<td width="304" valign="top" bgcolor="#F5F0E6" style="background:#F5F0E6; border-radius:26px 0 0 26px; padding:40px 12px 0 38px; ' + poppins + ' color:#4d453c">'

        html += '<div style="font-size:11px; line-height:16px; font-weight:bold; letter-spacing:3px; color:#8a7f6f">CONFIRMAÇÃO DE E-MAIL</div>'
        html += '<div style="' + lora + ' font-size:36px; line-height:40px; font-weight:bold; color:#1f1b18; padding-top:14px">Olá!<br>Seu código<br>chegou.</div>'
        html += '<div style="font-size:15px; line-height:23px; padding-top:14px">Use o código abaixo para confirmar seu e-mail e entrar na Peak.</div>'

        // o código, numa caixinha escura
        html += '<table cellpadding="0" cellspacing="0" border="0" style="margin-top:24px"><tr>'
        html += '<td bgcolor="#1f1b18" style="background:#1f1b18; border-radius:16px; padding:14px 22px 14px 30px; ' + lora + ' font-size:36px; line-height:44px; font-weight:bold; letter-spacing:8px; color:#F4EEE1">' + codigo + '</td>'
        html += '</tr></table>'

        html += '<div style="font-size:13px; line-height:19px; color:#8a7f6f; padding-top:26px">Se não foi você que pediu, é só ignorar este e-mail.</div>'

        html += '</td>'
        html += '<td width="260" style="font-size:0; line-height:0"><img src="' + meio + '" width="260" height="520" alt="" style="display:block; border:0"></td>'
        html += '</tr>'

        // linha 3: a ponta da fita da espada, que passa um pouco do cartão
        html += '<tr>'
        html += '<td width="340" colspan="2" style="font-size:0; line-height:0">&nbsp;</td>'
        html += '<td width="260" style="font-size:0; line-height:0"><img src="' + base + '" width="260" height="24" alt="" style="display:block; border:0"></td>'
        html += '</tr>'

        // rodapé
        html += '<tr><td colspan="3" align="center" style="padding-top:18px; ' + poppins + ' font-size:12px; color:#8a7f6f">Peak</td></tr>'

        html += '</table>'
        html += '</td></tr></table>'

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
            text: 'Olá! Seu código de confirmação da Peak é: ' + codigo
        }

        // o HTML bonito vai sempre
        mensagem.html = Email.montarEmail(codigo, 'cid')

        // As 3 partes da personagem estão dentro do emailImagens.js.
        // O cid é o nome usado no <img src="cid:..."> lá no montarEmail.
        if(emailImagens != null){
            mensagem.attachments = [
                { filename: 'peak-topo.jpg', content: Buffer.from(emailImagens.topo, 'base64'), cid: 'peak-topo' },
                { filename: 'peak-meio.jpg', content: Buffer.from(emailImagens.meio, 'base64'), cid: 'peak-meio' },
                { filename: 'peak-base.jpg', content: Buffer.from(emailImagens.base, 'base64'), cid: 'peak-base' }
            ]
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
            htmlContent: Email.montarEmail(codigo, emailConfig.siteUrl),
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
