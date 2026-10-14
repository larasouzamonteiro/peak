// emailConfig.js  (VERSÃO SERVIDOR)
// NADA de senha escrita aqui: tudo vem das variáveis de ambiente do Render.
//
// No Render o Gmail não funciona (o plano grátis bloqueia), então o e-mail
// sai pelo Brevo (https://www.brevo.com), que é grátis até 300 e-mails por dia.
//
//   EMAIL_REMETENTE -> o e-mail que você confirmou no Brevo (ex.: projetopeak.rpg@gmail.com)
//   BREVO_API_KEY   -> a chave que o Brevo te dá (começa com xkeysib-)
//   SITE_URL        -> o endereço do site no Render (ex.: https://peak.onrender.com)
//
// No seu computador também dá para usar o Gmail como antes:
//   EMAIL_GMAIL e SENHA_APP_GMAIL

module.exports = {
    remetente: process.env.EMAIL_REMETENTE || '',
    brevoChave: process.env.BREVO_API_KEY || '',
    siteUrl: process.env.SITE_URL || '',

    email: process.env.EMAIL_GMAIL || '',
    senha: process.env.SENHA_APP_GMAIL || ''
}
