// UsuariosBD.js
// Tabela "usuarios": cadastro, código do e-mail, login, token e perfil.

const bcrypt = require('bcrypt')
const crypto = require('crypto')
const conexao = require('./conexao')
const Email = require('./Email')
const Sms = require('./Sms')

// A senha nunca é guardada como o usuário digitou.
// No cadastro:  bcrypt.hash(senha, 10)           -> gera o hash que vai para o banco
// No login:     bcrypt.compareSync(senha, hash)  -> confere se a senha digitada bate com o hash

// Sorteia o código de 6 números que vai para o e-mail (ex.: '482913')
// (versão servidor: crypto.randomInt é um sorteio seguro, que não dá para adivinhar)
function gerarCodigo(){
    return String(crypto.randomInt(0, 1000000)).padStart(6, '0')
}

// Celular: '(48) 99999-8888' vira '5548999998888' (o jeito que o Brevo pede: 55 + DDD + número).
// replace(/\D/g, '') tira tudo que não é número (parênteses, espaço, traço).
// Devolve null se não for um celular válido (o DDD + número têm que dar 10 ou 11 números).
function limparTelefone(texto){
    var numeros = String(texto || '').replace(/\D/g, '')

    if(numeros.length == 10 || numeros.length == 11){
        return '55' + numeros
    }

    return null
}

// Data e hora de agora menos "dias", no formato do MySQL ('2026-10-14 13:05:00')
function dataHora(diasAtras){
    var d = new Date(Date.now() - diasAtras * 24 * 60 * 60 * 1000)
    function dois(n){ return String(n).padStart(2, '0') }
    return d.getFullYear() + '-' + dois(d.getMonth() + 1) + '-' + dois(d.getDate()) + ' ' + dois(d.getHours()) + ':' + dois(d.getMinutes()) + ':' + dois(d.getSeconds())
}

class UsuariosBD{

    static connect(){
        // versão servidor: usa o pool (veja database/conexao.js)
        return conexao
    }

    // ---------- CADASTRO ----------
    // usuario: { nomeUsuario, email, senha, telefone }   (telefone é opcional)
    // A conta é criada com emailVerificado = 0 e um código é enviado para o e-mail.
    static async addUsuario(usuario, callback){
        var {nomeUsuario, email, senha} = usuario

        // celular (opcional): se digitou alguma coisa, tem que ser um celular válido
        var telefone = null

        if(usuario.telefone){
            telefone = limparTelefone(usuario.telefone)

            if(telefone == null){
                return callback({'error': 'Digite o celular com DDD, ex.: (48) 99999-8888'})
            }
        }

        if(!nomeUsuario || !email || !senha){
            return callback({'error': 'Insira os dados corretamente'})
        }

        // versão servidor: tudo tem que ser texto (senão alguém manda um objeto e confunde o SQL)
        if(typeof nomeUsuario != 'string' || typeof email != 'string' || typeof senha != 'string'){
            return callback({'error': 'Insira os dados corretamente'})
        }

        // o nome não pode ter @, senão alguém poderia "roubar" o e-mail de outra pessoa como nome
        if(nomeUsuario.indexOf('@') != -1){
            return callback({'error': 'O nome de usuário não pode ter @'})
        }

        // um e-mail só, no formato nome@site.com
        if(!/^[^\s@,;]+@[^\s@,;]+\.[^\s@,;]+$/.test(email)){
            return callback({'error': 'Digite um e-mail válido'})
        }

        if(senha.length > 72){
            return callback({'error': 'A senha pode ter no máximo 72 caracteres'})
        }

        // os tamanhos são os mesmos das colunas da tabela usuarios (banco.sql)
        if(nomeUsuario.length > 30 || email.length > 80){
            return callback({'error': 'O nome de usuário (até 30 letras) ou o e-mail (até 80) está grande demais'})
        }

        if(senha.length < 6){
            return callback({'error': 'A senha precisa ter pelo menos 6 caracteres'})
        }

        var senhaHash = await bcrypt.hash(senha, 10)
        var codigo = gerarCodigo()

        const connection = UsuariosBD.connect()

        // o nome de usuário e o e-mail não podem repetir
        var sql = 'select id from usuarios where nomeUsuario = ? or email = ?'

        connection.query(sql, [nomeUsuario, email], (error, results)=>{
            if(error){ console.log(error.message); return callback({'error': 'Erro no servidor. Tente de novo.'}) }

            if(results.length > 0){
                connection.end()
                return callback({'error': 'Esse nome de usuário ou e-mail já está cadastrado!'})
            }

            var novo = {nomeUsuario: nomeUsuario, email: email, senha: senhaHash, codigoEmail: codigo, telefone: telefone}

            connection.query('insert into usuarios set ?', novo, (error, results)=>{
                if(error){ console.log(error.message); return callback({'error': 'Erro no servidor. Tente de novo.'}) }

                connection.end()
                Email.enviarCodigo(email, codigo)
                callback({'message': 'Conta criada! Enviamos um código para o seu e-mail.'})
            })
        })
    }

    // Confere o código que a pessoa digitou. dados: { email, codigo }
    static confirmarCodigo(dados, callback){
        var {email, codigo} = dados

        if(!email || !codigo){
            return callback({'error': 'Digite o e-mail e o código'})
        }

        const connection = UsuariosBD.connect()

        var sql = 'select id, codigoEmail from usuarios where email = ?'

        connection.query(sql, [email], (error, results)=>{
            if(error){ console.log(error.message); return callback({'error': 'Erro no servidor. Tente de novo.'}) }

            if(results.length == 0 || results[0].codigoEmail != codigo){
                connection.end()
                return callback({'error': 'Código incorreto!'})
            }

            var sql = 'update usuarios set emailVerificado = 1, codigoEmail = null where id = ?'

            connection.query(sql, [results[0].id], (error, results)=>{
                if(error){ console.log(error.message); return callback({'error': 'Erro no servidor. Tente de novo.'}) }

                connection.end()
                callback({'message': 'E-mail confirmado! Agora é só entrar.'})
            })
        })
    }

    // Sorteia um código novo e manda de novo. dados: { email }
    static reenviarCodigo(dados, callback){
        var email = dados.email
        var codigo = gerarCodigo()

        if(!email){
            return callback({'error': 'Digite o e-mail'})
        }

        const connection = UsuariosBD.connect()

        var sql = 'update usuarios set codigoEmail = ? where email = ? and emailVerificado = 0'

        connection.query(sql, [codigo, email], (error, results)=>{
            if(error){ console.log(error.message); return callback({'error': 'Erro no servidor. Tente de novo.'}) }

            connection.end()

            // affectedRows = quantas linhas o update mudou (0 = não achou a conta)
            if(results.affectedRows == 0){
                return callback({'error': 'Não achei uma conta esperando confirmação com esse e-mail.'})
            }

            Email.enviarCodigo(email, codigo)
            callback({'message': 'Enviamos um código novo.'})
        })
    }

    // ---------- ESQUECI MINHA SENHA ----------
    // Usa a MESMA coluna codigoEmail do cadastro (não precisou mudar o banco):
    //   1. pedirTrocaSenha: sorteia um código, guarda em codigoEmail e manda por e-mail ou SMS
    //   2. trocarSenha: se o código bater, troca a senha e apaga o código
    //      (o código é o mesmo tipo nos dois casos, por isso o trocarSenha não muda)

    // dados: { email, via }   via: 'email' ou 'sms'
    static pedirTrocaSenha(dados, callback){
        var email = dados.email

        if(!email || typeof email != 'string'){
            return callback({'error': 'Digite o e-mail'})
        }

        var codigo = gerarCodigo()

        const connection = UsuariosBD.connect()

        // só conta com e-mail já confirmado (emailVerificado = 1)
        var sql = 'select id, telefone from usuarios where email = ? and emailVerificado = 1'

        connection.query(sql, [email], (error, results)=>{
            if(error){ console.log(error.message); return callback({'error': 'Erro no servidor. Tente de novo.'}) }

            // a resposta é a mesma achando ou não a conta: assim ninguém descobre
            // quais e-mails têm conta na Peak
            var resposta = {'message': 'Se esse e-mail tiver uma conta na Peak, o código já foi enviado.'}

            if(results.length == 0){
                connection.end()
                return callback(resposta)
            }

            var pessoa = results[0]

            connection.query('update usuarios set codigoEmail = ? where id = ?', [codigo, pessoa.id], (error, results)=>{
                if(error){ console.log(error.message); return callback({'error': 'Erro no servidor. Tente de novo.'}) }

                connection.end()

                // escolheu SMS e tem celular salvo: vai por SMS. Se não, vai por e-mail.
                if(dados.via == 'sms' && pessoa.telefone){
                    // se o SMS falhar (ex.: sem créditos no Brevo), o código vai por e-mail
                    // para a pessoa não ficar esperando um SMS que nunca chega
                    Sms.enviarCodigo(pessoa.telefone, codigo, function(){
                        Email.enviarCodigo(email, codigo, 'senha')
                    })
                }else{
                    Email.enviarCodigo(email, codigo, 'senha')
                }

                callback(resposta)
            })
        })
    }

    // dados: { email, codigo, senha }
    static async trocarSenha(dados, callback){
        var {email, codigo, senha} = dados

        if(!email || !codigo || !senha || typeof email != 'string' || typeof codigo != 'string' || typeof senha != 'string'){
            return callback({'error': 'Preencha o código e a senha nova'})
        }

        // as mesmas regras de senha do cadastro
        if(senha.length < 6){
            return callback({'error': 'A senha precisa ter pelo menos 6 caracteres'})
        }

        if(senha.length > 72){
            return callback({'error': 'A senha pode ter no máximo 72 caracteres'})
        }

        var senhaHash = await bcrypt.hash(senha, 10)

        const connection = UsuariosBD.connect()

        var sql = 'select id, codigoEmail from usuarios where email = ? and emailVerificado = 1'

        connection.query(sql, [email], (error, results)=>{
            if(error){ console.log(error.message); return callback({'error': 'Erro no servidor. Tente de novo.'}) }

            // codigoEmail null = ninguém pediu código
            if(results.length == 0 || results[0].codigoEmail == null || results[0].codigoEmail != codigo){
                connection.end()
                return callback({'error': 'Código incorreto!'})
            }

            // troca a senha, apaga o código (só vale uma vez) e apaga o token
            // (quem estava logado com a senha velha precisa entrar de novo)
            var sql = 'update usuarios set senha = ?, codigoEmail = null, token = null where id = ?'

            connection.query(sql, [senhaHash, results[0].id], (error, results)=>{
                if(error){ console.log(error.message); return callback({'error': 'Erro no servidor. Tente de novo.'}) }

                connection.end()
                callback({'message': 'Senha trocada! Agora é só entrar com a senha nova.'})
            })
        })
    }

    // ---------- LOGIN ----------
    // usuario: { nomeUsuario, senha }  (no lugar do nome pode vir o e-mail)
    // Se der certo, gera um TOKEN (código aleatório) e guarda no banco.
    // A página guarda esse token e manda em todo pedido, assim o servidor
    // sabe QUEM está pedindo sem precisar da senha de novo.
    static login(usuario, callback){
        var {nomeUsuario, senha} = usuario

        if(!nomeUsuario || !senha || typeof nomeUsuario != 'string' || typeof senha != 'string'){
            return callback({'error': 'Insira os dados corretamente'})
        }

        const connection = UsuariosBD.connect()

        var sql = 'select id, nomeUsuario, email, senha, tipo, emailVerificado, tutorialVisto from usuarios where nomeUsuario = ? or email = ?'

        connection.query(sql, [nomeUsuario, nomeUsuario], (error, results)=>{
            if(error){ console.log(error.message); return callback({'error': 'Erro no servidor. Tente de novo.'}) }

            if(results.length == 0){
                connection.end()
                return callback({'error': 'Usuário ou senha incorretos!', errouSenha: true})
            }

            var user = results[0]

            // conta sem senha válida (ex.: o admin antes de rodar o criar-admin.js)
            if(!user.senha || user.senha.indexOf('$2') != 0){
                return callback({'error': 'Usuário ou senha incorretos!', errouSenha: true})
            }

            const senhaValida = bcrypt.compareSync(senha, user.senha)

            if(!senhaValida){
                connection.end()
                return callback({'error': 'Usuário ou senha incorretos!', errouSenha: true})
            }

            // ainda não digitou o código do e-mail: a página manda para confirmar.html
            if(user.emailVerificado == 0){
                connection.end()
                return callback({'error': 'Confirme o seu e-mail antes de entrar.', confirmar: true, email: user.email})
            }

            var token = crypto.randomBytes(32).toString('hex')

            // versão servidor: guarda também QUANDO o token foi criado (ele vale 7 dias)
            connection.query('update usuarios set token = ?, tokenCriadoEm = ? where id = ?', [token, dataHora(0), user.id], (error, results)=>{
                if(error){ console.log(error.message); return callback({'error': 'Erro no servidor. Tente de novo.'}) }

                connection.end()
                callback({
                    'message': 'Login realizado com sucesso!',
                    token: token,
                    usuario: {id: user.id, nomeUsuario: user.nomeUsuario, tipo: user.tipo, tutorialVisto: user.tutorialVisto}
                })
            })
        })
    }

    // versão servidor: SAIR apaga o token no banco (ele para de valer na hora)
    static sair(usuarioId, callback){
        const connection = UsuariosBD.connect()

        connection.query('update usuarios set token = null where id = ?', [usuarioId], (error, results)=>{
            if(error){ console.log(error.message); return callback({'error': 'Erro no servidor. Tente de novo.'}) }

            callback({'message': 'Até logo!'})
        })
    }

    // Descobre quem é o dono do token. Devolve o usuário ou null.
    static buscarPorToken(token, callback){
        if(!token){
            return callback(null)
        }

        const connection = UsuariosBD.connect()

        if(typeof token != 'string' || token.length != 64){
            return callback(null)
        }

        // versão servidor: o token só vale por 7 dias depois do login
        var sql = 'select id, nomeUsuario, tipo from usuarios where token = ? and tokenCriadoEm > ?'

        connection.query(sql, [token, dataHora(7)], (error, results)=>{
            if(error){ console.log(error.message); return callback(null) }

            if(results.length == 0){
                callback(null)
            }else{
                callback(results[0])
            }
        })

        connection.end()
    }

    // A pessoa terminou (ou pulou) o tutorial da Zero: não aparece mais.
    static marcarTutorialVisto(usuarioId, callback){
        const connection = UsuariosBD.connect()

        connection.query('update usuarios set tutorialVisto = 1 where id = ?', [usuarioId], (error, results)=>{
            if(error){ console.log(error.message); return callback({'error': 'Erro no servidor. Tente de novo.'}) }

            callback({'message': 'Tutorial concluído!'})
        })

        connection.end()
    }

    // ---------- PERFIL ----------
    // Dados que QUALQUER pessoa logada pode ver de um usuário (sem senha e sem e-mail).
    static getUsuario(id, callback){
        const connection = UsuariosBD.connect()

        var sql = 'select id, nomeUsuario, tipo, fotoPerfil, capaPerfil, bio, contato from usuarios where id = ?'

        connection.query(sql, [id], (error, results)=>{
            if(error){ console.log(error.message); return callback({'error': 'Erro no servidor. Tente de novo.'}) }

            if(results.length == 0){
                callback({'error': 'Usuário não encontrado'})
            }else{
                callback(results[0])
            }
        })

        connection.end()
    }

    // dados: { bio, contato }
    static atualizarPerfil(dados, usuarioId, callback){
        const connection = UsuariosBD.connect()

        var sql = 'update usuarios set bio = ?, contato = ? where id = ?'

        connection.query(sql, [dados.bio, dados.contato, usuarioId], (error, results)=>{
            if(error){ console.log(error.message); return callback({'error': 'Erro no servidor. Tente de novo.'}) }

            callback({'message': 'Perfil salvo!'})
        })

        connection.end()
    }

    // imagem: a foto escolhida, já transformada em texto pela página (função lerImagem)
    static atualizarFoto(imagem, usuarioId, callback){
        const connection = UsuariosBD.connect()

        connection.query('update usuarios set fotoPerfil = ? where id = ?', [imagem, usuarioId], (error, results)=>{
            if(error){ console.log(error.message); return callback({'error': 'Erro no servidor. Tente de novo.'}) }

            callback({'message': 'Foto trocada!'})
        })

        connection.end()
    }

    static atualizarCapa(imagem, usuarioId, callback){
        const connection = UsuariosBD.connect()

        connection.query('update usuarios set capaPerfil = ? where id = ?', [imagem, usuarioId], (error, results)=>{
            if(error){ console.log(error.message); return callback({'error': 'Erro no servidor. Tente de novo.'}) }

            callback({'message': 'Capa trocada!'})
        })

        connection.end()
    }
}

module.exports = UsuariosBD
