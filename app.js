// app.js  (VERSÃO SERVIDOR - para colocar no ar)
// Servidor da Peak. Usa só http e url, como na aula.
//
// É o mesmo jeito do projeto de login da aula (http, url, callback, classes BD).
// O que esta versão tem a mais (procure "VERSÃO SERVIDOR"):
//   1. entrega as páginas (pasta front/), então o site abre pelo link
//   2. login com token: o servidor sabe quem está pedindo
//   3. recusa pedidos grandes demais (mais de 4 MB)
//   4. bloqueia por 1 minuto quem erra a senha ou o código 5 vezes
//   5. usa a porta que o Render mandar (process.env.PORT)
//
// Para ligar:   node app.js
// Endereço:     http://localhost:3000
//
// GET  -> devolve dados
// POST -> recebe dados em JSON pelo corpo da requisição
//
// O servidor sempre responde em JSON:
//   deu certo -> { 'message': '...' }  (ou a lista pedida)
//   deu erro  -> { 'error': '...' }
//
// Cada rota chama uma função de uma classe da pasta database/
// (é lá que ficam as consultas SQL).

const http = require('http')
const url = require('url')
const fs = require('fs')
const path = require('path')

const UsuariosBD = require('./database/UsuariosBD')
const ComunidadeBD = require('./database/ComunidadeBD')
const FichasBD = require('./database/FichasBD')
const RacasBD = require('./database/RacasBD')
const ClassesBD = require('./database/ClassesBD')
const MonstrosBD = require('./database/MonstrosBD')
const CampanhasBD = require('./database/CampanhasBD')
const SessoesBD = require('./database/SessoesBD')
const AvisosBD = require('./database/AvisosBD')
const RecadosBD = require('./database/RecadosBD')
const ImagensBD = require('./database/ImagensBD')     // FOTOS MAIS RÁPIDAS (explicado lá embaixo)


// =====================================================
// VERSÃO SERVIDOR: AJUDANTES DE SEGURANÇA
// =====================================================

// ----- 1. entregar as páginas -----
// Só a pasta front/ é entregue. database/, app.js, as senhas... nunca.
const PASTA_FRONT = path.join(__dirname, 'front')

const TIPOS = {
    '.html': 'text/html; charset=utf-8', '.css': 'text/css; charset=utf-8', '.js': 'text/javascript; charset=utf-8',
    '.png': 'image/png', '.jpg': 'image/jpeg', '.jpeg': 'image/jpeg', '.gif': 'image/gif', '.svg': 'image/svg+xml',
    '.webp': 'image/webp', '.ico': 'image/x-icon', '.wav': 'audio/wav', '.mp3': 'audio/mpeg', '.ogg': 'audio/ogg',
    '.mp4': 'video/mp4', '.webm': 'video/webm'     // VISUAL: os vídeos do fundo do index
}

// Página de erro bonita (front/html/404.html) para endereço que não existe.
// O status continua 404 para o navegador saber que a página não existe.
function paginaNaoEncontrada(res){
    fs.readFile(path.join(PASTA_FRONT, 'html', '404.html'), (erro, conteudo)=>{
        if(erro){
            res.writeHead(404, {'Content-Type': 'text/plain; charset=utf-8'})
            return res.end('Página não encontrada')
        }

        res.writeHead(404, {'Content-Type': 'text/html; charset=utf-8'})
        res.end(conteudo)
    })
}

function entregarArquivo(pathname, res){
    // o endereço puro (https://site.com/) manda a pessoa para /html/index.html.
    // Precisa ser um "redirecionamento" (302) para os links da página funcionarem.
    if(pathname == '/'){
        res.writeHead(302, {'Location': '/html/index.html'})
        return res.end()
    }

    // try/catch: um endereço quebrado (ex.: /html/%E0) faria o decodeURIComponent dar erro
    var caminho
    try{
        caminho = path.normalize(path.join(PASTA_FRONT, decodeURIComponent(pathname)))
    }catch(erro){
        return paginaNaoEncontrada(res)
    }

    // impede pedidos como /../database/config.js (sair da pasta front)
    if(caminho.indexOf(PASTA_FRONT + path.sep) != 0){
        res.writeHead(403)
        return res.end()
    }

    var tipo = TIPOS[path.extname(caminho).toLowerCase()]

    fs.readFile(caminho, (erro, conteudo)=>{
        if(erro || !tipo){
            return paginaNaoEncontrada(res)
        }

        // fotos, vídeos e sons ficam guardados no navegador por 7 dias:
        // quem volta ao site não baixa tudo de novo (economiza a banda do Render)
        var cache = 'no-cache'
        if(/\.(jpg|jpeg|png|gif|webp|svg|mp4|webm|mp3)$/i.test(caminho)){
            cache = 'public, max-age=604800'
        }

        res.writeHead(200, {'Content-Type': tipo, 'Cache-Control': cache})
        res.end(conteudo)
    })
}

// ----- 2. conferir os dados que chegam -----
// Os dados do POST precisam ser textos ou números (a lista de itens da ficha é a única lista).
// Por quê: se alguém mandar um OBJETO no lugar de um texto, o mysql transforma
// o "where id = ?" em outra coisa e o SQL pode mexer em linhas que não devia.
function temObjeto(dados){
    for(var campo in dados){
        if(campo != 'itemIds' && dados[campo] !== null && typeof dados[campo] == 'object'){
            return true
        }
    }
    return false
}

// ----- 3. bloquear tentativas repetidas -----
// Guarda quantas vezes alguém errou. Passou do limite, bloqueia por 1 minuto.
// (era 15 minutos; ficou 1 minuto para dar para mostrar na apresentação)
// (fica na memória: se o servidor reiniciar, zera)
var tentativas = {}

// limite: quantos erros pode ter (5 se não disser nada)
function bloqueado(chave, limite){
    var t = tentativas[chave]
    return t != undefined && t.erros >= (limite || 5) && Date.now() < t.ate
}

function contarErro(chave){
    var t = tentativas[chave]

    if(t == undefined || Date.now() > t.ate){
        t = {erros: 0, ate: 0}
    }

    t.erros = t.erros + 1
    t.ate = Date.now() + 1 * 60 * 1000      // 1 minuto (60 segundos x 1000 milissegundos)
    tentativas[chave] = t
}

function limparErros(chave){
    delete tentativas[chave]
}

// reenviar o código: no máximo 1 vez por minuto para cada e-mail
var ultimoReenvio = {}

function responder(res, status, objeto){
    res.writeHead(status, {'Content-Type': 'application/json'})
    res.end(JSON.stringify(objeto))
}


// Só continua (chama "depois") se a pessoa estiver logada.
// Depois do login, a página manda o token em todo pedido no cabeçalho
// "Authorization". Com ele o servidor descobre quem é a pessoa.
function exigirLogin(req, res, depois){

    UsuariosBD.buscarPorToken(req.headers['authorization'], (usuario)=>{

        if(usuario == null){
            res.writeHead(401, {'Content-Type': 'application/json'})
            res.end(JSON.stringify({'error': 'Entre na sua conta de novo.', sair: true}))
            return
        }

        depois(usuario)
    })
}

// Igual ao exigirLogin, mas só deixa passar quem é administrador.
function exigirAdmin(req, res, depois){

    exigirLogin(req, res, (usuario)=>{

        if(usuario.tipo != 'admin'){
            res.writeHead(403, {'Content-Type': 'application/json'})
            res.end(JSON.stringify({'error': 'Só administradores podem fazer isso.'}))
            return
        }

        depois(usuario)
    })
}


const callback = (req, res)=>{

    // VERSÃO SERVIDOR: as páginas e o servidor estão no MESMO endereço,
    // então não precisa do "Access-Control-Allow-Origin" (CORS) da versão da aula.
    var rota = url.parse(req.url, true)

    // VERSÃO SERVIDOR: arquivos do site (páginas, css, js, imagens, sons)
    if(req.method == 'GET' && (rota.pathname == '/' || /^\/(html|css|js|img|sons)\//.test(rota.pathname))){
        entregarArquivo(rota.pathname, res)
        return
    }

    // FOTOS MAIS RÁPIDAS: /imagem?tipo=monstro&id=7 entrega uma foto só (função lá embaixo)
    if(req.method == 'GET' && rota.pathname == '/imagem'){
        entregarImagem(rota, res)
        return
    }

    // =====================================================
    // GET
    // =====================================================
    if(req.method == 'GET'){

        // ----- listas fixas (para os formulários) -----
        if(rota.pathname == '/interesses'){

            exigirLogin(req, res, (usuario)=>{
                ComunidadeBD.getInteresses((interesses)=>{
                    res.writeHead(200, {'Content-Type': 'application/json'})
                    res.end(JSON.stringify(interesses))
                })
            })

        }else if(rota.pathname == '/parcerias'){

            exigirLogin(req, res, (usuario)=>{
                ComunidadeBD.getParcerias((parcerias)=>{
                    res.writeHead(200, {'Content-Type': 'application/json'})
                    res.end(JSON.stringify(parcerias))
                })
            })

        }else if(rota.pathname == '/itens'){

            exigirLogin(req, res, (usuario)=>{
                FichasBD.getItens((itens)=>{
                    res.writeHead(200, {'Content-Type': 'application/json'})
                    res.end(JSON.stringify(itens))
                })
            })

        // ----- perfil de uma pessoa: /usuario?id=3 -----
        }else if(rota.pathname == '/usuario'){

            exigirLogin(req, res, (usuario)=>{
                UsuariosBD.getUsuario(rota.query.id, (pessoa)=>{
                    ImagensBD.trocarFotos([pessoa], 'fotoPerfil', 'perfil')     // FOTOS MAIS RÁPIDAS
                    ImagensBD.trocarFotos([pessoa], 'capaPerfil', 'capa')     // FOTOS MAIS RÁPIDAS
                    res.writeHead(200, {'Content-Type': 'application/json'})
                    res.end(JSON.stringify(pessoa))
                })
            })

        }else if(rota.pathname == '/usuario/interesses'){

            exigirLogin(req, res, (usuario)=>{
                ComunidadeBD.getInteressesDoUsuario(rota.query.id, (interesses)=>{
                    res.writeHead(200, {'Content-Type': 'application/json'})
                    res.end(JSON.stringify(interesses))
                })
            })

        }else if(rota.pathname == '/usuario/parcerias'){

            exigirLogin(req, res, (usuario)=>{
                ComunidadeBD.getParceriasDoUsuario(rota.query.id, (parcerias)=>{
                    res.writeHead(200, {'Content-Type': 'application/json'})
                    res.end(JSON.stringify(parcerias))
                })
            })

        }else if(rota.pathname == '/usuario/fichas'){

            exigirLogin(req, res, (usuario)=>{
                FichasBD.getFichas(rota.query.id, (fichas)=>{
                    ImagensBD.trocarFotos(fichas, 'retrato', 'ficha')     // FOTOS MAIS RÁPIDAS
                    res.writeHead(200, {'Content-Type': 'application/json'})
                    res.end(JSON.stringify(fichas))
                })
            })

        }else if(rota.pathname == '/usuario/campanhas'){

            exigirLogin(req, res, (usuario)=>{
                CampanhasBD.getCampanhas(rota.query.id, (campanhas)=>{
                    ImagensBD.trocarFotos(campanhas, 'imagemCapa', 'campanha')     // FOTOS MAIS RÁPIDAS
                    res.writeHead(200, {'Content-Type': 'application/json'})
                    res.end(JSON.stringify(campanhas))
                })
            })

        // ----- amigos do perfil: /usuario/companheiros?id=3 -----
        // quem já esteve numa campanha junto com a pessoa (Mestre ou jogador).
        // A lista é a mesma para qualquer pessoa logada que abrir o perfil.
        }else if(rota.pathname == '/usuario/companheiros'){

            exigirLogin(req, res, function(usuario){
                CampanhasBD.getCompanheiros(rota.query.id, function(companheiros){
                    ImagensBD.trocarFotos(companheiros, 'fotoPerfil', 'perfil')     // FOTOS MAIS RÁPIDAS
                    res.writeHead(200, {'Content-Type': 'application/json'})
                    res.end(JSON.stringify(companheiros))
                })
            })

        // ----- comunidade -----
        }else if(rota.pathname == '/comunidade/pessoas'){

            exigirLogin(req, res, (usuario)=>{
                ComunidadeBD.getPessoas((pessoas)=>{
                    ImagensBD.trocarFotos(pessoas, 'fotoPerfil', 'perfil')     // FOTOS MAIS RÁPIDAS
                    res.writeHead(200, {'Content-Type': 'application/json'})
                    res.end(JSON.stringify(pessoas))
                })
            })

        }else if(rota.pathname == '/comunidade/interesses'){

            exigirLogin(req, res, (usuario)=>{
                ComunidadeBD.getTodosInteresses((interesses)=>{
                    res.writeHead(200, {'Content-Type': 'application/json'})
                    res.end(JSON.stringify(interesses))
                })
            })

        }else if(rota.pathname == '/comunidade/parcerias'){

            exigirLogin(req, res, (usuario)=>{
                ComunidadeBD.getTodasParcerias((parcerias)=>{
                    res.writeHead(200, {'Content-Type': 'application/json'})
                    res.end(JSON.stringify(parcerias))
                })
            })

        // ----- fichas, raças e classes -----

        // ----- mural da comunidade -----
        }else if(rota.pathname == '/recados'){

            exigirLogin(req, res, (usuario)=>{
                RecadosBD.getRecados(usuario.id, (recados)=>{
                    ImagensBD.trocarFotos(recados, 'foto', 'recado')     // FOTOS MAIS RÁPIDAS
                    ImagensBD.trocarFotos(recados, 'fotoPerfil', 'perfil', 'usuarioId')     // FOTOS MAIS RÁPIDAS
                    res.writeHead(200, {'Content-Type': 'application/json'})
                    res.end(JSON.stringify(recados))
                })
            })

        }else if(rota.pathname == '/recados/em-alta'){

            exigirLogin(req, res, (usuario)=>{
                RecadosBD.getEmAlta((tags)=>{
                    res.writeHead(200, {'Content-Type': 'application/json'})
                    res.end(JSON.stringify(tags))
                })

                
            })  
        
        
            }else if(rota.pathname == '/fichas'){

            // só as fichas de quem está logado
            exigirLogin(req, res, (usuario)=>{
                FichasBD.getFichas(usuario.id, (fichas)=>{
                    ImagensBD.trocarFotos(fichas, 'retrato', 'ficha')     // FOTOS MAIS RÁPIDAS
                    res.writeHead(200, {'Content-Type': 'application/json'})
                    res.end(JSON.stringify(fichas))
                })
            })

        }else if(rota.pathname == '/ficha'){

            // /ficha?id=3 -> uma ficha completa
            exigirLogin(req, res, (usuario)=>{
                FichasBD.getFicha(rota.query.id, (ficha)=>{
                    res.writeHead(200, {'Content-Type': 'application/json'})
                    res.end(JSON.stringify(ficha))
                })
            })

        }else if(rota.pathname == '/ficha/itens'){

            exigirLogin(req, res, (usuario)=>{
                FichasBD.getItensDaFicha(rota.query.id, (itens)=>{
                    res.writeHead(200, {'Content-Type': 'application/json'})
                    res.end(JSON.stringify(itens))
                })
            })

        }else if(rota.pathname == '/racas'){

            exigirLogin(req, res, (usuario)=>{
                RacasBD.getRacas(usuario.id, (racas)=>{
                    res.writeHead(200, {'Content-Type': 'application/json'})
                    res.end(JSON.stringify(racas))
                })
            })

        }else if(rota.pathname == '/classes'){

            exigirLogin(req, res, (usuario)=>{
                ClassesBD.getClasses(usuario.id, (classes)=>{
                    res.writeHead(200, {'Content-Type': 'application/json'})
                    res.end(JSON.stringify(classes))
                })
            })

        // ----- monstros -----
        }else if(rota.pathname == '/monstros'){

            exigirLogin(req, res, (usuario)=>{
                MonstrosBD.getMonstros(usuario.id, (monstros)=>{
                    ImagensBD.trocarFotos(monstros, 'imagem', 'monstro')     // FOTOS MAIS RÁPIDAS
                    res.writeHead(200, {'Content-Type': 'application/json'})
                    res.end(JSON.stringify(monstros))
                })
            })

        // ----- campanhas -----
        }else if(rota.pathname == '/campanhas'){

            exigirLogin(req, res, (usuario)=>{
                CampanhasBD.getCampanhas(usuario.id, (campanhas)=>{
                    ImagensBD.trocarFotos(campanhas, 'imagemCapa', 'campanha')     // FOTOS MAIS RÁPIDAS
                    res.writeHead(200, {'Content-Type': 'application/json'})
                    res.end(JSON.stringify(campanhas))
                })
            })

        }else if(rota.pathname == '/campanhas/oficiais'){

            exigirLogin(req, res, (usuario)=>{
                CampanhasBD.getOficiais((oficiais)=>{
                    ImagensBD.trocarFotos(oficiais, 'imagemCapa', 'campanha')     // FOTOS MAIS RÁPIDAS
                    res.writeHead(200, {'Content-Type': 'application/json'})
                    res.end(JSON.stringify(oficiais))
                })
            })

        }else if(rota.pathname == '/campanha'){

            // /campanha?id=3 -> uma campanha (só para quem participa dela)
            exigirLogin(req, res, (usuario)=>{
                CampanhasBD.getCampanha(rota.query.id, usuario.id, (campanha)=>{
                    ImagensBD.trocarFotos([campanha], 'imagemCapa', 'campanha')     // FOTOS MAIS RÁPIDAS
                    res.writeHead(200, {'Content-Type': 'application/json'})
                    res.end(JSON.stringify(campanha))
                })
            })

        }else if(rota.pathname == '/campanha/jogadores'){

            exigirLogin(req, res, (usuario)=>{
                CampanhasBD.getJogadores(rota.query.id, usuario.id, (jogadores)=>{
                    ImagensBD.trocarFotos(jogadores, 'retrato', 'ficha')     // FOTOS MAIS RÁPIDAS
                    res.writeHead(200, {'Content-Type': 'application/json'})
                    res.end(JSON.stringify(jogadores))
                })
            })

        }else if(rota.pathname == '/campanha/monstros'){

            exigirLogin(req, res, (usuario)=>{
                CampanhasBD.getMonstros(rota.query.id, usuario.id, (monstros)=>{
                    ImagensBD.trocarFotos(monstros, 'imagem', 'monstro', 'monstroId')     // FOTOS MAIS RÁPIDAS
                    res.writeHead(200, {'Content-Type': 'application/json'})
                    res.end(JSON.stringify(monstros))
                })
            })

        // ----- avisos da Peak (aparecem no topo do Início) -----
        }else if(rota.pathname == '/avisos'){

            exigirLogin(req, res, (usuario)=>{
                AvisosBD.getAvisos((avisos)=>{
                    res.writeHead(200, {'Content-Type': 'application/json'})
                    res.end(JSON.stringify(avisos))
                })
            })

        }else if(rota.pathname == '/sessoes'){

            // /sessoes?campanhaId=3
            exigirLogin(req, res, (usuario)=>{
                SessoesBD.getSessoes(rota.query.campanhaId, usuario.id, (sessoes)=>{
                    res.writeHead(200, {'Content-Type': 'application/json'})
                    res.end(JSON.stringify(sessoes))
                })
            })

        }else{
            // endereço digitado errado (ex.: /lara): mostra a página 404 bonita
            paginaNaoEncontrada(res)
        }

    // =====================================================
    // POST
    // =====================================================
    }else if(req.method == 'POST'){

        // quando o método for POST os dados vêm pelo CORPO da requisição (e não pela URL como no GET)
        var body = ''
        var grandeDemais = false

        // VERSÃO SERVIDOR: no máximo 4 MB por pedido (uma imagem de 2,5 MB em base64 cabe)
        req.on('data', (data)=>{
            body += data

            if(body.length > 4 * 1024 * 1024 && !grandeDemais){
                grandeDemais = true
                responder(res, 413, {'error': 'Dados grandes demais'})
                req.destroy()
            }
        })

        req.on('end', ()=>{

            if(grandeDemais){
                return
            }

            var dados = {}

            // VERSÃO SERVIDOR: se o JSON vier quebrado, responde erro em vez de travar
            try{
                if(body != ''){
                    dados = JSON.parse(body)
                }
            }catch(e){
                dados = null
            }

            if(dados == null || typeof dados != 'object' || Array.isArray(dados)){
                return responder(res, 400, {'error': 'Dados inválidos'})
            }

            if(temObjeto(dados)){
                return responder(res, 400, {'error': 'Dados inválidos'})
            }

            // ----- cadastro e login (não pedem token) -----
            if(rota.pathname == '/registro'){

                UsuariosBD.addUsuario(dados, (message)=>{
                    res.writeHead(201, {'Content-Type': 'application/json'})
                    res.end(JSON.stringify(message))
                })

            }else if(rota.pathname == '/registro/confirmar'){

                // 5 códigos errados para o mesmo e-mail: bloqueia 1 minuto
                var chaveCodigo = 'codigo:' + String(dados.email).toLowerCase()

                if(bloqueado(chaveCodigo)){
                    return responder(res, 429, {'error': 'Muitas tentativas. Tente de novo em 1 minuto.'})
                }

                UsuariosBD.confirmarCodigo(dados, (message)=>{
                    if(message.error){
                        contarErro(chaveCodigo)
                    }else{
                        limparErros(chaveCodigo)
                    }
                    res.writeHead(200, {'Content-Type': 'application/json'})
                    res.end(JSON.stringify(message))
                })

            }else if(rota.pathname == '/registro/reenviar'){

                var emailReenvio = String(dados.email).toLowerCase()

                if(ultimoReenvio[emailReenvio] && Date.now() - ultimoReenvio[emailReenvio] < 60 * 1000){
                    return responder(res, 429, {'error': 'Espere 1 minuto para pedir outro código.'})
                }
                ultimoReenvio[emailReenvio] = Date.now()

                UsuariosBD.reenviarCodigo(dados, (message)=>{
                    res.writeHead(200, {'Content-Type': 'application/json'})
                    res.end(JSON.stringify(message))
                })

            // ----- ESQUECI MINHA SENHA (página nova-senha.html) -----
            // Usa a mesma coluna codigoEmail do cadastro: não precisa mudar o banco.
            }else if(rota.pathname == '/senha/pedir'){

                // igual ao reenviar: no máximo 1 código por minuto para cada e-mail
                var emailSenha = String(dados.email).toLowerCase()

                if(ultimoReenvio[emailSenha] && Date.now() - ultimoReenvio[emailSenha] < 60 * 1000){
                    return responder(res, 429, {'error': 'Espere 1 minuto para pedir outro código.'})
                }
                ultimoReenvio[emailSenha] = Date.now()

                UsuariosBD.pedirTrocaSenha(dados, (message)=>{
                    responder(res, 200, message)
                })

            }else if(rota.pathname == '/senha/trocar'){

                // 5 códigos errados para o mesmo e-mail: bloqueia 1 minuto (a mesma regra do cadastro)
                var chaveSenha = 'senha:' + String(dados.email).toLowerCase()

                if(bloqueado(chaveSenha)){
                    return responder(res, 429, {'error': 'Muitas tentativas. Tente de novo em 1 minuto.'})
                }

                UsuariosBD.trocarSenha(dados, (message)=>{
                    if(message.error){
                        contarErro(chaveSenha)
                    }else{
                        limparErros(chaveSenha)
                    }
                    responder(res, 200, message)
                })

            }else if(rota.pathname == '/login'){

                // 5 senhas erradas para o mesmo usuário: bloqueia essa conta por 1 minuto
                var chaveLogin = 'login:' + String(dados.nomeUsuario).toLowerCase()

                if(bloqueado(chaveLogin)){
                    return responder(res, 429, {'error': 'Muitas tentativas erradas. Tente de novo em 1 minuto.'})
                }

                UsuariosBD.login(dados, (message)=>{
                    if(message.errouSenha){
                        contarErro(chaveLogin)
                        delete message.errouSenha
                    }else if(message.token){
                        limparErros(chaveLogin)
                    }
                    res.writeHead(200, {'Content-Type': 'application/json'})
                    res.end(JSON.stringify(message))
                })

            // VERSÃO SERVIDOR: sair apaga o token no banco
            }else if(rota.pathname == '/logout'){

                exigirLogin(req, res, (usuario)=>{
                    UsuariosBD.sair(usuario.id, (message)=>{
                        responder(res, 200, message)
                    })
                })

            // Daqui para baixo tudo pede login. O id de quem está mexendo vem
            // SEMPRE do token (usuario.id), nunca do que a página mandou.
            // ----- perfil -----
            }else if(rota.pathname == '/tutorial/visto'){

                exigirLogin(req, res, (usuario)=>{
                    UsuariosBD.marcarTutorialVisto(usuario.id, (message)=>{
                        res.writeHead(200, {'Content-Type': 'application/json'})
                        res.end(JSON.stringify(message))
                    })
                })

            }else if(rota.pathname == '/perfil/atualizar'){

                exigirLogin(req, res, (usuario)=>{
                    UsuariosBD.atualizarPerfil(dados, usuario.id, (message)=>{
                        res.writeHead(200, {'Content-Type': 'application/json'})
                        res.end(JSON.stringify(message))
                    })
                })

            }else if(rota.pathname == '/perfil/foto'){

                exigirLogin(req, res, (usuario)=>{
                    UsuariosBD.atualizarFoto(dados.imagem, usuario.id, (message)=>{
                        res.writeHead(200, {'Content-Type': 'application/json'})
                        res.end(JSON.stringify(message))
                    })
                })

            }else if(rota.pathname == '/perfil/capa'){

                exigirLogin(req, res, (usuario)=>{
                    UsuariosBD.atualizarCapa(dados.imagem, usuario.id, (message)=>{
                        res.writeHead(200, {'Content-Type': 'application/json'})
                        res.end(JSON.stringify(message))
                    })
                })

            }else if(rota.pathname == '/perfil/interesses/adicionar'){

                exigirLogin(req, res, (usuario)=>{
                    ComunidadeBD.addInteresse(dados.interesseId, usuario.id, (message)=>{
                        res.writeHead(200, {'Content-Type': 'application/json'})
                        res.end(JSON.stringify(message))
                    })
                })

            }else if(rota.pathname == '/perfil/interesses/remover'){

                exigirLogin(req, res, (usuario)=>{
                    ComunidadeBD.removerInteresse(dados.interesseId, usuario.id, (message)=>{
                        res.writeHead(200, {'Content-Type': 'application/json'})
                        res.end(JSON.stringify(message))
                    })
                })

            }else if(rota.pathname == '/perfil/parcerias/adicionar'){

                exigirLogin(req, res, (usuario)=>{
                    ComunidadeBD.addParceria(dados, usuario.id, (message)=>{
                        res.writeHead(200, {'Content-Type': 'application/json'})
                        res.end(JSON.stringify(message))
                    })
                })

            }else if(rota.pathname == '/perfil/parcerias/remover'){

                exigirLogin(req, res, (usuario)=>{
                    ComunidadeBD.removerParceria(dados, usuario.id, (message)=>{
                        res.writeHead(200, {'Content-Type': 'application/json'})
                        res.end(JSON.stringify(message))
                    })
                })

            // ----- fichas -----
            }else if(rota.pathname == '/fichas/criar'){

                exigirLogin(req, res, (usuario)=>{
                    dados.usuarioId = usuario.id

                    FichasBD.addFicha(dados, (message)=>{
                        res.writeHead(201, {'Content-Type': 'application/json'})
                        res.end(JSON.stringify(message))
                    })
                })

            }else if(rota.pathname == '/fichas/atualizar'){

                exigirLogin(req, res, (usuario)=>{
                    FichasBD.atualizar(dados, usuario.id, (message)=>{
                        res.writeHead(200, {'Content-Type': 'application/json'})
                        res.end(JSON.stringify(message))
                    })
                })

            }else if(rota.pathname == '/fichas/excluir'){

                exigirLogin(req, res, (usuario)=>{
                    FichasBD.excluir(dados.id, usuario.id, (message)=>{
                        res.writeHead(200, {'Content-Type': 'application/json'})
                        res.end(JSON.stringify(message))
                    })
                })

            // ----- raças -----
            }else if(rota.pathname == '/racas/criar'){

                exigirLogin(req, res, (usuario)=>{
                    dados.usuarioId = usuario.id

                    RacasBD.addRaca(dados, (message)=>{
                        res.writeHead(201, {'Content-Type': 'application/json'})
                        res.end(JSON.stringify(message))
                    })
                })

            }else if(rota.pathname == '/racas/atualizar'){

                exigirLogin(req, res, (usuario)=>{
                    RacasBD.atualizar(dados, usuario.id, (message)=>{
                        res.writeHead(200, {'Content-Type': 'application/json'})
                        res.end(JSON.stringify(message))
                    })
                })

            }else if(rota.pathname == '/racas/excluir'){

                exigirLogin(req, res, (usuario)=>{
                    RacasBD.excluir(dados.id, usuario.id, (message)=>{
                        res.writeHead(200, {'Content-Type': 'application/json'})
                        res.end(JSON.stringify(message))
                    })
                })

            // ----- classes -----
            }else if(rota.pathname == '/classes/criar'){

                exigirLogin(req, res, (usuario)=>{
                    dados.usuarioId = usuario.id

                    ClassesBD.addClasse(dados, (message)=>{
                        res.writeHead(201, {'Content-Type': 'application/json'})
                        res.end(JSON.stringify(message))
                    })
                })

            }else if(rota.pathname == '/classes/atualizar'){

                exigirLogin(req, res, (usuario)=>{
                    ClassesBD.atualizar(dados, usuario.id, (message)=>{
                        res.writeHead(200, {'Content-Type': 'application/json'})
                        res.end(JSON.stringify(message))
                    })
                })

            }else if(rota.pathname == '/classes/excluir'){

                exigirLogin(req, res, (usuario)=>{
                    ClassesBD.excluir(dados.id, usuario.id, (message)=>{
                        res.writeHead(200, {'Content-Type': 'application/json'})
                        res.end(JSON.stringify(message))
                    })
                })

            // ----- monstros -----
            }else if(rota.pathname == '/monstros/criar'){

                exigirLogin(req, res, (usuario)=>{
                    dados.usuarioId = usuario.id

                    MonstrosBD.addMonstro(dados, (message)=>{
                        res.writeHead(201, {'Content-Type': 'application/json'})
                        res.end(JSON.stringify(message))
                    })
                })

            }else if(rota.pathname == '/monstros/atualizar'){

                exigirLogin(req, res, (usuario)=>{
                    MonstrosBD.atualizar(dados, usuario.id, (message)=>{
                        res.writeHead(200, {'Content-Type': 'application/json'})
                        res.end(JSON.stringify(message))
                    })
                })

            }else if(rota.pathname == '/monstros/excluir'){

                exigirLogin(req, res, (usuario)=>{
                    MonstrosBD.excluir(dados.id, usuario.id, (message)=>{
                        res.writeHead(200, {'Content-Type': 'application/json'})
                        res.end(JSON.stringify(message))
                    })
                })

            // ----- campanhas -----
            }else if(rota.pathname == '/campanhas/criar'){

                // quem cria a campanha é o Mestre dela
                exigirLogin(req, res, (usuario)=>{
                    dados.usuarioMestreId = usuario.id

                    CampanhasBD.addCampanha(dados, (message)=>{
                        res.writeHead(201, {'Content-Type': 'application/json'})
                        res.end(JSON.stringify(message))
                    })
                })

            }else if(rota.pathname == '/campanhas/atualizar'){

                exigirLogin(req, res, (usuario)=>{
                    CampanhasBD.atualizar(dados, usuario.id, (message)=>{
                        res.writeHead(200, {'Content-Type': 'application/json'})
                        res.end(JSON.stringify(message))
                    })
                })

            }else if(rota.pathname == '/campanhas/excluir'){

                exigirLogin(req, res, (usuario)=>{
                    CampanhasBD.excluir(dados.id, usuario.id, (message)=>{
                        res.writeHead(200, {'Content-Type': 'application/json'})
                        res.end(JSON.stringify(message))
                    })
                })

            }else if(rota.pathname == '/campanhas/usar-oficial'){

                // "Usar como minha campanha": copia a oficial e a pessoa vira Mestre
                exigirLogin(req, res, (usuario)=>{
                    CampanhasBD.usarOficial(dados.id, usuario.id, (message)=>{
                        res.writeHead(201, {'Content-Type': 'application/json'})
                        res.end(JSON.stringify(message))
                    })
                })

            }else if(rota.pathname == '/campanhas/entrar'){

                exigirLogin(req, res, (usuario)=>{
                    dados.usuarioId = usuario.id

                    CampanhasBD.entrar(dados, (message)=>{
                        res.writeHead(200, {'Content-Type': 'application/json'})
                        res.end(JSON.stringify(message))
                    })
                })

            }else if(rota.pathname == '/campanhas/sair'){

                exigirLogin(req, res, (usuario)=>{
                    CampanhasBD.sair(dados.campanhaId, usuario.id, (message)=>{
                        res.writeHead(200, {'Content-Type': 'application/json'})
                        res.end(JSON.stringify(message))
                    })
                })

            }else if(rota.pathname == '/campanhas/monstros/adicionar'){

                exigirLogin(req, res, (usuario)=>{
                    dados.usuarioId = usuario.id

                    CampanhasBD.addMonstro(dados, (message)=>{
                        res.writeHead(200, {'Content-Type': 'application/json'})
                        res.end(JSON.stringify(message))
                    })
                })

            }else if(rota.pathname == '/campanhas/monstros/remover'){

                exigirLogin(req, res, (usuario)=>{
                    CampanhasBD.removerMonstro(dados.linhaId, usuario.id, (message)=>{
                        res.writeHead(200, {'Content-Type': 'application/json'})
                        res.end(JSON.stringify(message))
                    })
                })

            // ----- sessões -----
            }else if(rota.pathname == '/sessoes/criar'){

                exigirLogin(req, res, (usuario)=>{
                    dados.usuarioId = usuario.id

                    SessoesBD.addSessao(dados, (message)=>{
                        res.writeHead(201, {'Content-Type': 'application/json'})
                        res.end(JSON.stringify(message))
                    })
                })

            }else if(rota.pathname == '/sessoes/excluir'){

                exigirLogin(req, res, (usuario)=>{
                    SessoesBD.excluir(dados.id, usuario.id, (message)=>{
                        res.writeHead(200, {'Content-Type': 'application/json'})
                        res.end(JSON.stringify(message))
                    })
                })


                            // ----- mural da comunidade -----
            }else if(rota.pathname == '/recados/publicar'){

                exigirLogin(req, res, (usuario)=>{
                    // o dono do recado é SEMPRE quem está logado (vem do token)
                    dados.usuarioId = usuario.id

                    RecadosBD.publicar(dados, (message)=>{
                        res.writeHead(201, {'Content-Type': 'application/json'})
                        res.end(JSON.stringify(message))
                    })
                })

            }else if(rota.pathname == '/recados/apagar'){

                exigirLogin(req, res, (usuario)=>{
                    RecadosBD.apagar(dados.id, usuario, (message)=>{
                        res.writeHead(200, {'Content-Type': 'application/json'})
                        res.end(JSON.stringify(message))
                    })
                })

            }else if(rota.pathname == '/recados/interesse'){

                exigirLogin(req, res, (usuario)=>{
                    RecadosBD.marcarInteresse(dados.id, usuario.id, (message)=>{
                        res.writeHead(200, {'Content-Type': 'application/json'})
                        res.end(JSON.stringify(message))
                    })
                })


                // Daqui para baixo só o ADMIN pode (exigirAdmin confere o tipo da conta).
            // ----- admin: monstros oficiais -----
            }else if(rota.pathname == '/admin/monstros/criar'){

                exigirAdmin(req, res, (usuario)=>{
                    MonstrosBD.addOficial(dados, (message)=>{
                        res.writeHead(201, {'Content-Type': 'application/json'})
                        res.end(JSON.stringify(message))
                    })
                })

            }else if(rota.pathname == '/admin/monstros/atualizar'){

                exigirAdmin(req, res, (usuario)=>{
                    MonstrosBD.atualizarOficial(dados, (message)=>{
                        res.writeHead(200, {'Content-Type': 'application/json'})
                        res.end(JSON.stringify(message))
                    })
                })

            }else if(rota.pathname == '/admin/monstros/excluir'){

                exigirAdmin(req, res, (usuario)=>{
                    MonstrosBD.excluirOficial(dados.id, (message)=>{
                        res.writeHead(200, {'Content-Type': 'application/json'})
                        res.end(JSON.stringify(message))
                    })
                })

            // ----- admin: raças oficiais -----
            }else if(rota.pathname == '/admin/racas/criar'){

                exigirAdmin(req, res, (usuario)=>{
                    RacasBD.addOficial(dados, (message)=>{
                        res.writeHead(201, {'Content-Type': 'application/json'})
                        res.end(JSON.stringify(message))
                    })
                })

            }else if(rota.pathname == '/admin/racas/atualizar'){

                exigirAdmin(req, res, (usuario)=>{
                    RacasBD.atualizarOficial(dados, (message)=>{
                        res.writeHead(200, {'Content-Type': 'application/json'})
                        res.end(JSON.stringify(message))
                    })
                })

            }else if(rota.pathname == '/admin/racas/excluir'){

                exigirAdmin(req, res, (usuario)=>{
                    RacasBD.excluirOficial(dados.id, (message)=>{
                        res.writeHead(200, {'Content-Type': 'application/json'})
                        res.end(JSON.stringify(message))
                    })
                })

            // ----- admin: classes oficiais -----
            }else if(rota.pathname == '/admin/classes/criar'){

                exigirAdmin(req, res, (usuario)=>{
                    ClassesBD.addOficial(dados, (message)=>{
                        res.writeHead(201, {'Content-Type': 'application/json'})
                        res.end(JSON.stringify(message))
                    })
                })

            }else if(rota.pathname == '/admin/classes/atualizar'){

                exigirAdmin(req, res, (usuario)=>{
                    ClassesBD.atualizarOficial(dados, (message)=>{
                        res.writeHead(200, {'Content-Type': 'application/json'})
                        res.end(JSON.stringify(message))
                    })
                })

            }else if(rota.pathname == '/admin/classes/excluir'){

                exigirAdmin(req, res, (usuario)=>{
                    ClassesBD.excluirOficial(dados.id, (message)=>{
                        res.writeHead(200, {'Content-Type': 'application/json'})
                        res.end(JSON.stringify(message))
                    })
                })

            // ----- admin: campanhas oficiais -----
            }else if(rota.pathname == '/admin/campanhas/criar'){

                exigirAdmin(req, res, (usuario)=>{
                    CampanhasBD.addOficial(dados, (message)=>{
                        res.writeHead(201, {'Content-Type': 'application/json'})
                        res.end(JSON.stringify(message))
                    })
                })

            }else if(rota.pathname == '/admin/campanhas/atualizar'){

                exigirAdmin(req, res, (usuario)=>{
                    CampanhasBD.atualizarOficial(dados, (message)=>{
                        res.writeHead(200, {'Content-Type': 'application/json'})
                        res.end(JSON.stringify(message))
                    })
                })

            }else if(rota.pathname == '/admin/campanhas/excluir'){

                exigirAdmin(req, res, (usuario)=>{
                    CampanhasBD.excluirOficial(dados.id, (message)=>{
                        res.writeHead(200, {'Content-Type': 'application/json'})
                        res.end(JSON.stringify(message))
                    })
                })

            // ----- admin: avisos da Peak -----
            }else if(rota.pathname == '/admin/avisos/criar'){

                exigirAdmin(req, res, (usuario)=>{
                    AvisosBD.addAviso(dados, (message)=>{
                        res.writeHead(201, {'Content-Type': 'application/json'})
                        res.end(JSON.stringify(message))
                    })
                })

            }else if(rota.pathname == '/admin/avisos/excluir'){

                exigirAdmin(req, res, (usuario)=>{
                    AvisosBD.excluir(dados.id, (message)=>{
                        res.writeHead(200, {'Content-Type': 'application/json'})
                        res.end(JSON.stringify(message))
                    })
                })

            }else{
                res.writeHead(404, {'Content-Type': 'application/json'})
                res.end(JSON.stringify({'error': 'Rota não encontrada'}))
            }
        })
    }
}

// Se der erro no banco (ex.: MySQL desligado), mostra no terminal em vez de derrubar o servidor
process.on('uncaughtException', (erro)=>{
    console.log('Erro:', erro.message)
})

// =====================================================
// FOTOS MAIS RÁPIDAS (nov/2026)
// =====================================================
// Entrega UMA foto que está salva no banco como texto ("data:image/webp;base64,....").
// Quem chama: o navegador, quando encontra <img src="/imagem?tipo=monstro&id=7">.
// (o endereço foi colocado na lista pelo ImagensBD.trocarFotos)
//
// Não pede login porque a tag <img> não manda o token.
function entregarImagem(rota, res){
    ImagensBD.getImagem(rota.query.tipo, rota.query.id, (foto)=>{

        // não achou a foto (ou não é uma foto em texto): responde "não existe"
        if(foto == null || foto.indexOf('data:') != 0){
            res.writeHead(404)
            res.end()
            return
        }

        // o texto tem duas partes separadas pela vírgula:
        //   "data:image/webp;base64"   ,   "UklGRl...(a foto em letras)"
        var virgula = foto.indexOf(',')
        var tipoDaImagem = foto.substring(5, foto.indexOf(';'))      // ex.: image/webp
        var letras = foto.substring(virgula + 1)

        // Buffer.from(..., 'base64') transforma as letras de volta na imagem de verdade
        var imagem = Buffer.from(letras, 'base64')

        res.writeHead(200, {
            'Content-Type': tipoDaImagem,
            'Cache-Control': 'public, max-age=604800'     // o navegador guarda a foto por 7 dias
        })
        res.end(imagem)
    })
}


// =====================================================
// LIGAR O SERVIDOR (computador, Render) OU ENTREGAR PARA A VERCEL
// =====================================================
// "node app.js" (no computador e no Render): require.main é este arquivo,
// então criamos o servidor e ficamos esperando pedidos na porta.
// Na Vercel quem roda é o api/index.js: ele só "pega" o callback abaixo
// (module.exports) e a própria Vercel chama callback(req, res) a cada pedido.
if(require.main === module){
    const server = http.createServer(callback)

    // VERSÃO SERVIDOR: o Render escolhe a porta e avisa pelo process.env.PORT
    const PORTA = process.env.PORT || 3000

    server.listen(PORTA, ()=>{
        console.log('Servidor rodando na porta ' + PORTA)
    })
}

module.exports = callback
