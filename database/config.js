// config.js  (VERSÃO SERVIDOR)
// Dados de conexão com o MySQL.
// No servidor (Render) as senhas NÃO ficam escritas aqui: elas vêm das
// "variáveis de ambiente" (process.env), que você digita no painel do Render.
// Assim o código pode ir para o GitHub sem expor nenhuma senha.
//
// Se a variável não existir (rodando no seu computador), usa o valor depois do ||

module.exports = {
    host: process.env.DB_HOST || 'localhost',
    port: Number(process.env.DB_PORT || 3306),
    user: process.env.DB_USER || 'root',
    password: process.env.DB_PASSWORD || '',
    database: process.env.DB_NAME || 'peak_final',
    dateStrings: true,          // as datas vêm como texto ('2026-10-10')
    connectionLimit: 5,         // no máximo 5 conexões abertas ao mesmo tempo (o Aiven grátis tem poucas)

    // o Aiven exige conexão criptografada (SSL). No seu computador fica desligado.
    ssl: process.env.DB_SSL == 'sim' ? {rejectUnauthorized: false} : undefined
}
