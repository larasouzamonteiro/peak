// smsConfig.js
// NADA de chave escrita aqui: tudo vem das variáveis de ambiente
// (no Render: Environment | no computador: arquivo .env, que não sobe para o GitHub).
//
//   BREVO_API_KEY -> a MESMA chave que o e-mail já usa (começa com xkeysib-)
//   SMS_REMETENTE -> o nome que aparece no SMS (até 11 letras). Se não colocar, fica "Peak".

module.exports = {
    brevoChave: process.env.BREVO_API_KEY || '',
    remetente: process.env.SMS_REMETENTE || 'Peak'
}
