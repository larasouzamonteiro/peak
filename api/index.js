// api/index.js  (só para a VERCEL)
// A Vercel não deixa um servidor ligado o tempo todo: a cada pedido ela chama
// uma função. Aqui entregamos para ela o mesmo callback(req, res) do app.js,
// então TODAS as rotas (/login, /fichas, /campanhas...) funcionam igualzinho.
// No computador e no Render este arquivo não é usado (lá roda "node app.js").
module.exports = require('../app.js')
