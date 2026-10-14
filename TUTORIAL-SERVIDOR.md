# Peak no ar (versão servidor)

Esta pasta é a **versão para o servidor**. A versão do computador (a da aula) continua igual, na outra pasta.

Para abrir esta versão no seu computador, rode `node app.js` e entre em **http://localhost:3000**.
Não dá para abrir clicando no `.html`, porque agora o próprio servidor entrega as páginas.

## Onde cada coisa fica

| O quê | Onde | Custo |
|---|---|---|
| O código | GitHub (repositório **privado**) | grátis |
| O site (`node app.js`) | Render | grátis (dorme depois de 15 min sem acesso e demora ~1 min para acordar) |
| O banco MySQL | Aiven | grátis (1 GB) |
| O e-mail do código | Brevo | grátis (300 por dia) |

## Passo a passo

**1. GitHub**
- Crie um repositório **privado** chamado `peak`.
- Suba esta pasta inteira. O `.gitignore` já impede a `node_modules` de subir.

**2. Aiven (o banco)**
- Crie a conta, clique em *Create service*, escolha **MySQL** e o plano **Free**.
- Anote os dados de *Connection information*: **Host, Port, User, Password**.

**3. Criar as tabelas**
- No MySQL Workbench, crie uma conexão nova com o Host, a Port, o User e a Password do Aiven.
- Na aba SSL, deixe *Use SSL* em *Require*.
- Abra `database/banco.sql` e execute tudo, **uma vez só**. Se rodar de novo, ele apaga tudo o que as pessoas fizeram.

**4. Senha da administradora**
- Na pasta do projeto, rode `npm install` e depois:
  `node gerar-senha-admin.js SEU_NOME SEU_EMAIL "uma-senha-forte-com-10+-letras"`
- Copie a linha `update usuarios ...` que aparecer e rode no Workbench conectado no Aiven.

**5. Brevo (o e-mail)**
- Crie a conta.
- Em *Senders*, adicione e confirme o Gmail da Peak.
- Em *SMTP & API*, depois *API Keys*, crie uma chave. Ela começa com `xkeysib-`.

**6. Render (o site)**
- Entre com o GitHub, clique em *New*, depois em *Web Service*, e escolha o repositório `peak`.
- **Build command:** `npm install`
- **Start command:** `node app.js`
- **Plan:** Free
- Em *Environment*, adicione as variáveis abaixo, **sem aspas**:

| Nome | Valor |
|---|---|
| `DB_HOST` | o Host do Aiven |
| `DB_PORT` | a Port do Aiven |
| `DB_USER` | o User do Aiven (`avnadmin`) |
| `DB_PASSWORD` | a Password do Aiven |
| `DB_NAME` | `peak_final` |
| `DB_SSL` | `sim` |
| `EMAIL_REMETENTE` | o Gmail que você confirmou no Brevo |
| `BREVO_API_KEY` | a chave do Brevo |
| `SITE_URL` | o endereço que o Render der, ex.: `https://peak-xxxx.onrender.com` (sem `/` no fim) |

Depois de salvar as variáveis, o Render instala tudo e liga o site. O link fica em cima, à esquerda.

## O que foi feito para ficar seguro

- **Senhas:** nenhuma senha fica escrita no código. Todas vêm das variáveis do Render.
- **Contas de exemplo:** o banco não tem contas com senha conhecida. A admin é criada pelo passo 4.
- **O que o servidor entrega:** só a pasta `front/`. Pedidos como `/../database/config.js` são recusados.
- **Tamanho dos pedidos:** no máximo 1 MB. JSON quebrado responde erro em vez de travar o servidor.
- **Dados conferidos:** nenhum campo pode ser um objeto (isso mudaria o sentido do SQL). Números e textos têm limite.
- **Imagens:** só aceita PNG, JPG, GIF ou WEBP enviados pela pessoa, ou imagens do próprio site.
- **Tentativas erradas:**
  - 5 senhas erradas seguidas para o mesmo usuário bloqueiam por 15 minutos;
  - 5 códigos de e-mail errados também bloqueiam;
  - o código só pode ser reenviado 1 vez por minuto.
- **Mensagem de erro do login:** é a mesma para usuário que não existe e para senha errada. Assim ninguém descobre quem tem conta.
- **Token do login:** vale 7 dias, e o botão Sair apaga ele no banco.
- **Campanhas:** só quem participa vê as sessões, os jogadores e os monstros. Só o Mestre vê o código de convite.
- **Coisas privadas de outra pessoa:** ninguém consegue usar o monstro, a raça ou a classe privada de outra pessoa.
- **Conexões com o banco:** ficam num "pool" (`database/conexao.js`), então nenhuma fica aberta para sempre.
- **Biblioteca do banco:** troquei `mysql` por `mysql2`, que funciona com o MySQL 8 do Aiven.
