// gerar-senha-admin.js  (VERSÃO SERVIDOR)
// Cria a linha de SQL que coloca o nome, o e-mail e a senha da administradora.
// A senha nunca vai pronta para o banco: o bcrypt embaralha antes.
//
// Como usar (na pasta do projeto, no seu computador):
//   node gerar-senha-admin.js NOME EMAIL SENHA
//   ex.: node gerar-senha-admin.js lara lara@gmail.com "Minha-Senha-Forte-2026"
//
// Ele mostra uma linha "update usuarios ...". Copie e rode no MySQL Workbench
// conectado no banco do Aiven.

const bcrypt = require('bcrypt')

var nome = process.argv[2]
var email = process.argv[3]
var senha = process.argv[4]

if(!nome || !email || !senha){
    console.log('Use assim:  node gerar-senha-admin.js NOME EMAIL SENHA')
    process.exit()
}

if(senha.length < 10){
    console.log('Use uma senha com pelo menos 10 caracteres (letras, números e símbolos).')
    process.exit()
}

var hash = bcrypt.hashSync(senha, 10)

console.log('\nCopie a linha abaixo e rode no MySQL Workbench (banco do Aiven):\n')
console.log("update usuarios set nomeUsuario = '" + nome.replace(/'/g, '') + "', email = '" + email.replace(/'/g, '') + "', senha = '" + hash + "' where id = 1 and tipo = 'admin';\n")
