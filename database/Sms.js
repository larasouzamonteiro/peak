// Sms.js
// Manda o código do "Esqueci minha senha" por SMS, usando o Brevo
// (o mesmo serviço do e-mail, com a mesma chave). Funciona igual ao
// Email.enviarPeloBrevo: um fetch para o endereço do Brevo.
// (fetch no servidor: o Node 18 ou mais novo já tem, não precisa instalar nada)

const smsConfig = require('./smsConfig')

class Sms{

    // telefone: só números, com o 55 na frente (ex.: '5548999998888')
    // codigo:   os 6 números (o mesmo tipo de código do e-mail)
    static enviarCodigo(telefone, codigo){

        // sem chave (no computador sem o .env): mostra o código no terminal, igual o e-mail faz
        if(smsConfig.brevoChave == ''){
            console.log('Código por SMS para ' + telefone + ': ' + codigo)
            return
        }

        fetch('https://api.brevo.com/v3/transactionalSMS/send', {
            method: 'POST',
            headers: {
                'api-key': smsConfig.brevoChave,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                sender: smsConfig.remetente,
                recipient: telefone,
                // sem acento de propósito: com acento cabe menos letra e pode virar 2 SMS (2 créditos)
                content: 'Peak: seu codigo para criar uma senha nova e ' + codigo,
                type: 'transactional'
            })
        })
        .then((resposta) => {
            if(resposta.ok){
                console.log('SMS enviado (Brevo) para ' + telefone)
            }else{
                resposta.text().then((texto) => console.log('O Brevo recusou o SMS:', texto))
            }
        })
        .catch((erro) => console.log('Não consegui falar com o Brevo:', erro.message))
    }
}

module.exports = Sms
