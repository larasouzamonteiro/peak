// Sms.js
// Manda o código do "Esqueci minha senha" por SMS usando o textBee:
// o SMS sai de um celular Android nosso, com o app do textBee aberto.
// (fetch no servidor: o Node 18 ou mais novo já tem, não precisa instalar nada)

const smsConfig = require('./smsConfig')

class Sms{

    // telefone: só números, com o 55 na frente (ex.: '5548999998888')
    // codigo:   os 6 números (o mesmo tipo de código do e-mail)
    // seFalhar: chamada se o SMS NÃO sair (celular desligado, sem chave...).
    //           Quem chama usa para mandar o código por e-mail (plano B).
    static enviarCodigo(telefone, codigo, seFalhar){

        // sem chave (no computador sem o .env): mostra o código no terminal
        if(smsConfig.textbeeChave == ''){
            console.log('Código por SMS para ' + telefone + ': ' + codigo)
            return
        }

        fetch('https://api.textbee.dev/api/v1/gateway/send-sms', {
            method: 'POST',
            headers: {
                'x-api-key': smsConfig.textbeeChave,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                recipients: ['+' + telefone],
                // sem acento de propósito: com acento cabe menos letra no SMS
                message: 'PEAK - Seu codigo para trocar a senha: ' + codigo + '. Se nao foi voce, ignore. Nao responda esta mensagem.'
            })
        })
        .then(function(resposta){
            if(resposta.ok){
                console.log('SMS enviado (textBee) para ' + telefone)
            }else{
                console.log('O textBee recusou o SMS. Plano B: mandando o código por e-mail')
                if(seFalhar){ seFalhar() }
            }
        })
        .catch(function(erro){
            console.log('Não consegui falar com o textBee:', erro.message)
            console.log('Plano B: mandando o código por e-mail')
            if(seFalhar){ seFalhar() }
        })
    }
}

module.exports = Sms
