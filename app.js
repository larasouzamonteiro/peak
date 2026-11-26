

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
const EventosBD = require('./database/EventosBD') 
const RecadosBD = require('./database/RecadosBD')
const ImagensBD = require('./database/ImagensBD')     // FOTOS MAIS RÁPIDAS (explicado lá embaixo)


const PASTA_FRONT = path.join(__dirname, 'front')


function tipoDoArquivo(extensao){
    if(extensao == '.html'){
        return 'text/html; charset=utf-8'
    }else if(extensao == '.css'){
        return 'text/css; charset=utf-8'
    }else if(extensao == '.js'){
        return 'text/javascript; charset=utf-8'
    }else if(extensao == '.png'){
        return 'image/png'
    }else if(extensao == '.jpg' || extensao == '.jpeg'){
        return 'image/jpeg'
    }else if(extensao == '.gif'){
        return 'image/gif'
    }else if(extensao == '.svg'){
        return 'image/svg+xml'
    }else if(extensao == '.webp'){
        return 'image/webp'
    }else if(extensao == '.ico'){
        return 'image/x-icon'
    }else if(extensao == '.wav'){
        return 'audio/wav'
    }else if(extensao == '.mp3'){
        return 'audio/mpeg'
    }else if(extensao == '.ogg'){
        return 'audio/ogg'
    }else if(extensao == '.mp4'){
        return 'video/mp4'               // VISUAL: os vídeos do fundo do index e dos banners
    }else if(extensao == '.webm'){
        return 'video/webm'
    }else if(extensao == '.woff2'){
        return 'font/woff2'              // VISUAL: a letra dos livros (css/fontes/)
    }

    return ''
}

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


function ehArquivoDoSite(pathname){
    if(pathname == '/'){
        return true
    }else if(pathname.indexOf('/html/') == 0 || pathname.indexOf('/css/') == 0 || pathname.indexOf('/js/') == 0){
        return true
    }else if(pathname.indexOf('/img/') == 0 || pathname.indexOf('/sons/') == 0){
        return true
    }

    return false
}

function entregarArquivo(pathname, res){
   
    if(pathname == '/'){
        res.writeHead(302, {'Location': '/html/index.html'})
        return res.end()
    }

   
    var caminho
    try{
        caminho = path.normalize(path.join(PASTA_FRONT, decodeURIComponent(pathname)))
    }catch(erro){
        return paginaNaoEncontrada(res)
    }

  
    if(caminho.indexOf(PASTA_FRONT + path.sep) != 0){
        res.writeHead(403)
        return res.end()
    }

    var extensao = path.extname(caminho).toLowerCase()   
    var tipo = tipoDoArquivo(extensao)

    fs.readFile(caminho, (erro, conteudo)=>{
        if(erro || tipo == ''){
            return paginaNaoEncontrada(res)
        }

       
        var cache = 'public, max-age=604800'
        if(extensao == '.html' || extensao == '.css' || extensao == '.js'){
            cache = 'no-cache'
        }

        res.writeHead(200, {'Content-Type': tipo, 'Cache-Control': cache})
        res.end(conteudo)
    })
}


function temObjeto(dados){
    for(var campo in dados){
        if(campo != 'itemIds' && dados[campo] != null && typeof dados[campo] == 'object'){
            return true
        }
    }
    return false
}


var tentativas = {}


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
    t.ate = Date.now() + 1 * 60 * 1000      
    tentativas[chave] = t
}

function limparErros(chave){
    delete tentativas[chave]
}


var ultimoReenvio = {}

function responder(res, status, objeto){
    res.writeHead(status, {'Content-Type': 'application/json'})
    res.end(JSON.stringify(objeto))
}


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


function verTudo(usuario, rota){
    if(usuario.tipo == 'admin' && rota.query.todos == '1'){
        return 'admin'
    }

    return 'comum'
}


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


    var rota = url.parse(req.url, true)


    if(req.method == 'GET' && ehArquivoDoSite(rota.pathname)){
        entregarArquivo(rota.pathname, res)
        return
    }

    if(req.method == 'GET' && rota.pathname == '/imagem'){
        entregarImagem(rota, res)
        return
    }


    if(req.method == 'GET'){


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


        }else if(rota.pathname == '/usuario'){

            exigirLogin(req, res, (usuario)=>{
                UsuariosBD.getUsuario(rota.query.id, (pessoa)=>{
                    ImagensBD.trocarFotos([pessoa], 'fotoPerfil', 'perfil')     // FOTOS MAIS RÁPIDAS
                    ImagensBD.trocarFotos([pessoa], 'capaPerfil', 'capa')     // FOTOS MAIS RÁPIDAS
                    ImagensBD.trocarFotos([pessoa], 'imagemSobre', 'sobre')   // FOTOS MAIS RÁPIDAS
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
                    ImagensBD.trocarFotos(campanhas, 'imagemCapa', 'campanha')     
                    res.writeHead(200, {'Content-Type': 'application/json'})
                    res.end(JSON.stringify(campanhas))
                })
            })

     
        }else if(rota.pathname == '/usuario/companheiros'){

            exigirLogin(req, res, function(usuario){
                CampanhasBD.getCompanheiros(rota.query.id, function(companheiros){
                    ImagensBD.trocarFotos(companheiros, 'fotoPerfil', 'perfil')    
                    res.writeHead(200, {'Content-Type': 'application/json'})
                    res.end(JSON.stringify(companheiros))
                })
            })

        // ----- comunidade -----
        }else if(rota.pathname == '/comunidade/pessoas'){

            exigirLogin(req, res, (usuario)=>{
                ComunidadeBD.getPessoas((pessoas)=>{
                    ImagensBD.trocarFotos(pessoas, 'fotoPerfil', 'perfil')     /
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

    
        }else if(rota.pathname == '/recados'){

            exigirLogin(req, res, (usuario)=>{
                RecadosBD.getRecados(usuario.id, (recados)=>{
                    ImagensBD.trocarFotos(recados, 'foto', 'recado')     
                    ImagensBD.trocarFotos(recados, 'fotoPerfil', 'perfil', 'usuarioId')    
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

          
            exigirLogin(req, res, (usuario)=>{
                FichasBD.getFichas(usuario.id, (fichas)=>{
                    ImagensBD.trocarFotos(fichas, 'retrato', 'ficha')     
                    res.writeHead(200, {'Content-Type': 'application/json'})
                    res.end(JSON.stringify(fichas))
                })
            })

        }else if(rota.pathname == '/ficha'){

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
            RacasBD.getRacas(usuario.id, verTudo(usuario, rota), (racas)=>{
                    res.writeHead(200, {'Content-Type': 'application/json'})
                    res.end(JSON.stringify(racas))
                })
            })

        }else if(rota.pathname == '/classes'){

            exigirLogin(req, res, (usuario)=>{
                 ClassesBD.getClasses(usuario.id, verTudo(usuario, rota), (classes)=>{
                    res.writeHead(200, {'Content-Type': 'application/json'})
                    res.end(JSON.stringify(classes))
                })
            })

   
        }else if(rota.pathname == '/monstros'){

            exigirLogin(req, res, (usuario)=>{
              MonstrosBD.getMonstros(usuario.id, verTudo(usuario, rota), (monstros)=>{
                    ImagensBD.trocarFotos(monstros, 'imagem', 'monstro')  
                    res.writeHead(200, {'Content-Type': 'application/json'})
                    res.end(JSON.stringify(monstros))
                })
            })

        // ----- campanhas -----
        }else if(rota.pathname == '/campanhas'){

            exigirLogin(req, res, (usuario)=>{
                CampanhasBD.getCampanhas(usuario.id, (campanhas)=>{
                    ImagensBD.trocarFotos(campanhas, 'imagemCapa', 'campanha')    
                    res.writeHead(200, {'Content-Type': 'application/json'})
                    res.end(JSON.stringify(campanhas))
                })
            })

        }else if(rota.pathname == '/campanhas/oficiais'){

            exigirLogin(req, res, (usuario)=>{
                 CampanhasBD.getOficiais(verTudo(usuario, rota), (oficiais)=>{
                    ImagensBD.trocarFotos(oficiais, 'imagemCapa', 'campanha')   
                    res.writeHead(200, {'Content-Type': 'application/json'})
                    res.end(JSON.stringify(oficiais))
                })
            })

        }else if(rota.pathname == '/campanha'){


            exigirLogin(req, res, (usuario)=>{
                CampanhasBD.getCampanha(rota.query.id, usuario.id, (campanha)=>{
                    ImagensBD.trocarFotos([campanha], 'imagemCapa', 'campanha')     
                    res.writeHead(200, {'Content-Type': 'application/json'})
                    res.end(JSON.stringify(campanha))
                })
            })

        }else if(rota.pathname == '/campanha/jogadores'){

            exigirLogin(req, res, (usuario)=>{
                CampanhasBD.getJogadores(rota.query.id, usuario.id, (jogadores)=>{
                    ImagensBD.trocarFotos(jogadores, 'retrato', 'ficha')     
                    res.writeHead(200, {'Content-Type': 'application/json'})
                    res.end(JSON.stringify(jogadores))
                })
            })

        }else if(rota.pathname == '/campanha/monstros'){

            exigirLogin(req, res, (usuario)=>{
                CampanhasBD.getMonstros(rota.query.id, usuario.id, (monstros)=>{
                    ImagensBD.trocarFotos(monstros, 'imagem', 'monstro', 'monstroId')   
                    res.writeHead(200, {'Content-Type': 'application/json'})
                    res.end(JSON.stringify(monstros))
                })
            })



        }else if(rota.pathname == '/eventos/ativo'){

            exigirLogin(req, res, (usuario)=>{
                EventosBD.getAtivo(usuario.id, (evento)=>{
                    res.writeHead(200, {'Content-Type': 'application/json'})
                    res.end(JSON.stringify(evento))
                })
            })

      
        }else if(rota.pathname == '/retratos/ganhos'){

            exigirLogin(req, res, (usuario)=>{
                EventosBD.getRetratosGanhos(usuario.id, (retratos)=>{
                    res.writeHead(200, {'Content-Type': 'application/json'})
                    res.end(JSON.stringify(retratos))
                })
            })



        }else if(rota.pathname == '/admin/eventos'){

            exigirAdmin(req, res, (usuario)=>{
                EventosBD.getEventos((eventos)=>{
                    res.writeHead(200, {'Content-Type': 'application/json'})
                    res.end(JSON.stringify(eventos))
                })
            })

   
        }else if(rota.pathname == '/avisos'){

            exigirLogin(req, res, (usuario)=>{
                AvisosBD.getAvisos((avisos)=>{
                    res.writeHead(200, {'Content-Type': 'application/json'})
                    res.end(JSON.stringify(avisos))
                })
            })

        }else if(rota.pathname == '/sessoes'){

         
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

    }else if(req.method == 'POST'){

 
        var body = ''
        var grandeDemais = false

    
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

       
            }else if(rota.pathname == '/senha/pedir'){

                var emailSenha = String(dados.email).toLowerCase()

                if(ultimoReenvio[emailSenha] && Date.now() - ultimoReenvio[emailSenha] < 60 * 1000){
                    return responder(res, 429, {'error': 'Espere 1 minuto para pedir outro código.'})
                }
                ultimoReenvio[emailSenha] = Date.now()

                UsuariosBD.pedirTrocaSenha(dados, (message)=>{
                    responder(res, 200, message)
                })

            }else if(rota.pathname == '/senha/trocar'){

            
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
            }else if(rota.pathname == '/logout'){

                exigirLogin(req, res, (usuario)=>{
                    UsuariosBD.sair(usuario.id, (message)=>{
                        responder(res, 200, message)
                    })
                })


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

            // a imagem do lado do "sobre mim" (nov/2026)
            }else if(rota.pathname == '/perfil/sobre-imagem'){

                exigirLogin(req, res, (usuario)=>{
                    UsuariosBD.atualizarImagemSobre(dados.imagem, usuario.id, (message)=>{
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
               
            // EVENTOS: a pessoa clicou em "Coletar tudo" no presente
            }else if(rota.pathname == '/eventos/visto'){

                exigirLogin(req, res, (usuario)=>{
                    EventosBD.marcarVisto(usuario.id, dados.eventoId, (message)=>{
                        res.writeHead(200, {'Content-Type': 'application/json'})
                        res.end(JSON.stringify(message))
                    })
                })

    
            }else if(rota.pathname == '/admin/eventos/criar'){

                exigirAdmin(req, res, (usuario)=>{
                    EventosBD.addEvento(dados, (message)=>{
                        res.writeHead(201, {'Content-Type': 'application/json'})
                        res.end(JSON.stringify(message))
                    })
                })

  
            }else if(rota.pathname == '/admin/eventos/excluir'){

                exigirAdmin(req, res, (usuario)=>{
                    EventosBD.excluir(dados.id, (message)=>{
                        res.writeHead(200, {'Content-Type': 'application/json'})
                        res.end(JSON.stringify(message))
                    })
                })

            }else if(rota.pathname == '/admin/eventos/mostrar-de-novo'){

                exigirAdmin(req, res, (usuario)=>{
                    EventosBD.mostrarDeNovo(dados.id, (message)=>{
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


process.on('uncaughtException', (erro)=>{
    console.log('Erro:', erro.message)
})


function entregarImagem(rota, res){
    ImagensBD.getImagem(rota.query.tipo, rota.query.id, (foto)=>{

      
        if(foto == null || foto.indexOf('data:') != 0){
            res.writeHead(404)
            res.end()
            return
        }


        var virgula = foto.indexOf(',')
        var tipoDaImagem = foto.substring(5, foto.indexOf(';'))     
        var letras = foto.substring(virgula + 1)

     
        var imagem = Buffer.from(letras, 'base64')

        res.writeHead(200, {
            'Content-Type': tipoDaImagem,
            'Cache-Control': 'public, max-age=604800'    
        })
        res.end(imagem)
    })
}


if(require.main === module){
    const server = http.createServer(callback)

    var PORTA = process.env.PORT

 
    if(PORTA == null){
        PORTA = 3000
    }

    server.listen(PORTA, ()=>{
        console.log('Servidor rodando na porta ' + PORTA)
    })
}

module.exports = callback
