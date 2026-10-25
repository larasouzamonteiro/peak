// smsConfig.js
// NADA de chave escrita aqui: tudo vem das variáveis de ambiente
// (no Render e na Vercel: Environment | no computador: arquivo .env, que não sobe para o GitHub).
//
//   TEXTBEE_API_KEY -> a chave do painel do textBee (textbee.dev)

module.exports = {
    textbeeChave: process.env.TEXTBEE_API_KEY || ''
}
