-- =====================================================
-- banco.sql  -  Banco de dados da Peak
-- =====================================================
-- Como usar: conecte o MySQL Workbench no banco do Aiven
-- e execute tudo de uma vez. Ele cria o banco "peak_final" do zero.
--
-- ATENÇÃO: a primeira linha APAGA o banco peak_final (se já existir)
-- para criar de novo. Os outros bancos do seu MySQL não são mexidos.
--
-- VERSÃO SERVIDOR (para o Aiven):
--   * NÃO tem contas de exemplo com senha conhecida.
--   * A conta de administradora é criada SEM senha. Depois de rodar este arquivo,
--     rode no seu computador:  node criar-admin.js   (veja o TUTORIAL-SERVIDOR.md)
--   * Rode este arquivo UMA VEZ só. Ele apaga o banco peak_final e cria de novo:
--     se rodar depois que as pessoas se cadastrarem, apaga tudo o que elas fizeram!
--
-- Regra que se repete em várias tabelas:
--   usuarioId vazio (NULL) = é oficial da Peak
--   usuarioId preenchido   = foi criado por aquela pessoa

DROP DATABASE IF EXISTS peaklocal;
CREATE DATABASE peaklocal CHARACTER SET utf8mb4 COLLATE utf8mb4_general_ci;
USE peaklocal;


-- ---------- USUÁRIOS ----------
-- tipo:            'usuario' ou 'admin' (admin só é marcado direto aqui no banco)
-- fotoPerfil/capa: a imagem enviada, guardada como texto (por isso LONGTEXT)
-- emailVerificado: 1 = já digitou o código que chegou no e-mail
-- codigoEmail:     o código de 6 números enviado no cadastro
-- tutorialVisto:   1 = já viu (ou pulou) o tutorial da Zero
-- token:           código do login (o servidor usa para saber quem está pedindo)
-- tokenCriadoEm:   quando o token foi criado (VERSÃO SERVIDOR: ele vale 7 dias)
CREATE TABLE usuarios(
    id INT AUTO_INCREMENT PRIMARY KEY,
    nomeUsuario VARCHAR(30) NOT NULL UNIQUE,
    email VARCHAR(80) NOT NULL UNIQUE,
    senha VARCHAR(255) NOT NULL,
    tipo ENUM('usuario', 'admin') NOT NULL DEFAULT 'usuario',
    fotoPerfil LONGTEXT,
    capaPerfil LONGTEXT,
    bio TEXT,
    contato VARCHAR(120),
    emailVerificado TINYINT(1) NOT NULL DEFAULT 0,
    codigoEmail VARCHAR(6) NULL,
    tutorialVisto TINYINT(1) NOT NULL DEFAULT 0,
    token VARCHAR(64) NULL,
    tokenCriadoEm DATETIME NULL
);

-- ---------- INTERESSES ----------
-- A lista de interesses é fixa. usuario_interesses diz quem marcou o quê.
CREATE TABLE interesses(
    id INT AUTO_INCREMENT PRIMARY KEY,
    nome VARCHAR(40) NOT NULL
);

CREATE TABLE usuario_interesses(
    id INT AUTO_INCREMENT PRIMARY KEY,
    usuarioId INT NOT NULL,
    interesseId INT NOT NULL,
    FOREIGN KEY (usuarioId) REFERENCES usuarios(id) ON DELETE CASCADE,
    FOREIGN KEY (interesseId) REFERENCES interesses(id) ON DELETE CASCADE
);

-- ---------- PARCERIAS ----------
-- A lista de parcerias é fixa (Ilustrador, Mestre...).
-- usuario_parcerias guarda duas coisas diferentes, separadas pela coluna "tipo":
--   'sou'     = a pessoa É aquilo       (sou ilustrador)
--   'procuro' = a pessoa PROCURA aquilo (procuro ilustrador)
CREATE TABLE parcerias(
    id INT AUTO_INCREMENT PRIMARY KEY,
    nome VARCHAR(40) NOT NULL
);

CREATE TABLE usuario_parcerias(
    id INT AUTO_INCREMENT PRIMARY KEY,
    usuarioId INT NOT NULL,
    parceriaId INT NOT NULL,
    tipo ENUM('sou', 'procuro') NOT NULL,
    FOREIGN KEY (usuarioId) REFERENCES usuarios(id) ON DELETE CASCADE,
    FOREIGN KEY (parceriaId) REFERENCES parcerias(id) ON DELETE CASCADE
);

-- ---------- RAÇAS ----------
-- imagem: a arte da raça
-- publico: 1 = aparece para todo mundo | 0 = só para quem criou
CREATE TABLE racas(
    id INT AUTO_INCREMENT PRIMARY KEY,
    usuarioId INT NULL,
    nome VARCHAR(40) NOT NULL,
    descricao TEXT,
    vidaMaxima INT NOT NULL DEFAULT 8,
    imagem LONGTEXT,
    publico TINYINT(1) NOT NULL DEFAULT 0,
    FOREIGN KEY (usuarioId) REFERENCES usuarios(id) ON DELETE CASCADE
);

-- ---------- CLASSES ----------
-- imagem: a arte da classe
CREATE TABLE classes(
    id INT AUTO_INCREMENT PRIMARY KEY,
    usuarioId INT NULL,
    nome VARCHAR(40) NOT NULL,
    descricao TEXT,
    imagem LONGTEXT,
    publico TINYINT(1) NOT NULL DEFAULT 0,
    FOREIGN KEY (usuarioId) REFERENCES usuarios(id) ON DELETE CASCADE
);

-- ---------- ITENS ----------
-- Lista fixa de itens que um personagem pode carregar (no máximo 3).
CREATE TABLE itens(
    id INT AUTO_INCREMENT PRIMARY KEY,
    nome VARCHAR(40) NOT NULL,
    tipo VARCHAR(20) NOT NULL,
    imagem VARCHAR(120)
);

-- ---------- FICHAS (PERSONAGENS) ----------
CREATE TABLE fichas(
    id INT AUTO_INCREMENT PRIMARY KEY,
    usuarioId INT NOT NULL,
    nome VARCHAR(50) NOT NULL,
    retrato LONGTEXT,
    racaId INT NOT NULL,
    classeId INT NOT NULL,
    nivel INT NOT NULL DEFAULT 1,
    vidaMaxima INT NOT NULL,
    vidaAtual INT NOT NULL,
    forca INT NOT NULL,
    destreza INT NOT NULL,
    constituicao INT NOT NULL,
    inteligencia INT NOT NULL,
    sabedoria INT NOT NULL,
    carisma INT NOT NULL,
    alinhamento VARCHAR(20),
    personalidade TEXT,
    historia TEXT,
    FOREIGN KEY (usuarioId) REFERENCES usuarios(id) ON DELETE CASCADE,
    FOREIGN KEY (racaId) REFERENCES racas(id),
    FOREIGN KEY (classeId) REFERENCES classes(id)
);

CREATE TABLE ficha_itens(
    id INT AUTO_INCREMENT PRIMARY KEY,
    fichaId INT NOT NULL,
    itemId INT NOT NULL,
    FOREIGN KEY (fichaId) REFERENCES fichas(id) ON DELETE CASCADE,
    FOREIGN KEY (itemId) REFERENCES itens(id) ON DELETE CASCADE
);

-- ---------- CAMPANHAS ----------
-- oficial = 1:  campanha oficial da Peak (feita pelo admin). Não tem Mestre nem código.
-- oficial = 0:  campanha de uma pessoa. usuarioMestreId é quem criou (o Mestre).
-- oficialId:    quando a pessoa clica em "Usar como minha campanha", a cópia guarda
--               aqui o id da campanha oficial de onde ela veio.
-- criadaPor:    nome de quem escreveu a história (aparece nas oficiais)
CREATE TABLE campanhas(
    id INT AUTO_INCREMENT PRIMARY KEY,
    usuarioMestreId INT NULL,
    nome VARCHAR(60) NOT NULL,
    descricao TEXT,
    historia TEXT,
    imagemCapa LONGTEXT,
    codigoConvite VARCHAR(12) NULL,
    oficial TINYINT(1) NOT NULL DEFAULT 0,
    oficialId INT NULL,
    criadaPor VARCHAR(60) NULL,
    FOREIGN KEY (usuarioMestreId) REFERENCES usuarios(id) ON DELETE CASCADE
);

-- quem joga em cada campanha, e com qual ficha
CREATE TABLE campanha_jogadores(
    id INT AUTO_INCREMENT PRIMARY KEY,
    campanhaId INT NOT NULL,
    usuarioId INT NOT NULL,
    fichaId INT NOT NULL,
    FOREIGN KEY (campanhaId) REFERENCES campanhas(id) ON DELETE CASCADE,
    FOREIGN KEY (usuarioId) REFERENCES usuarios(id) ON DELETE CASCADE,
    FOREIGN KEY (fichaId) REFERENCES fichas(id) ON DELETE CASCADE
);

-- ---------- MONSTROS ----------
-- usuarioId vazio = monstro oficial.
-- campanhaOficialId: se estiver preenchido, o monstro é DAQUELA campanha oficial
--                    (aparece na faixa dela no Bestiário). Vazio = monstro geral da Peak.
CREATE TABLE monstros(
    id INT AUTO_INCREMENT PRIMARY KEY,
    usuarioId INT NULL,
    campanhaOficialId INT NULL,
    nome VARCHAR(50) NOT NULL,
    imagem LONGTEXT,
    descricao TEXT,
    vidaMaxima INT NOT NULL DEFAULT 10,
    defesa INT NOT NULL DEFAULT 10,
    publico TINYINT(1) NOT NULL DEFAULT 0,
    FOREIGN KEY (usuarioId) REFERENCES usuarios(id) ON DELETE CASCADE,
    FOREIGN KEY (campanhaOficialId) REFERENCES campanhas(id) ON DELETE CASCADE
);

-- os monstros que o Mestre escolheu para a campanha dele
CREATE TABLE campanha_monstros(
    id INT AUTO_INCREMENT PRIMARY KEY,
    campanhaId INT NOT NULL,
    monstroId INT NOT NULL,
    FOREIGN KEY (campanhaId) REFERENCES campanhas(id) ON DELETE CASCADE,
    FOREIGN KEY (monstroId) REFERENCES monstros(id) ON DELETE CASCADE
);

-- ---------- SESSÕES ----------
CREATE TABLE sessoes(
    id INT AUTO_INCREMENT PRIMARY KEY,
    campanhaId INT NOT NULL,
    nome VARCHAR(80) NOT NULL,
    data DATE NOT NULL,
    descricao TEXT,
    resultado TEXT,
    FOREIGN KEY (campanhaId) REFERENCES campanhas(id) ON DELETE CASCADE
);


-- =====================================================
-- DADOS DE EXEMPLO
-- =====================================================

-- a administradora (id 1). A senha '!' não funciona: rode o criar-admin.js para escolher a senha.
INSERT INTO usuarios
(nomeUsuario, email, senha, tipo, fotoPerfil, capaPerfil, bio, contato, emailVerificado, tutorialVisto)
VALUES
('laraadmin', 'projetopeak.rpg@gmail.com', '!', 'admin', '../img/mascote/zero.jpg', '../img/mascote/espada.jpg', 'Olá! Eu sou a Lara, da equipe da Peak. Cuido das campanhas oficiais e dos monstros do Bestiário.', 'Discord: lara.peak', 1, 1);

-- interesses (ids 1 a 9)
INSERT INTO interesses
(nome)
VALUES
('RPG'), ('D&D'), ('Old Dragon'), ('Anime'), ('Jogos'), ('Fantasia'), ('Terror'), ('Ficção científica'), ('Aventura');

-- parcerias (ids 1 a 6)
INSERT INTO parcerias
(nome)
VALUES
('Ilustrador'), ('Mestre'), ('Jogador'), ('Escritor'), ('Músico'), ('Criador de mapas');

-- raças oficiais (ids 1 a 6)
INSERT INTO racas
(usuarioId, nome, descricao, vidaMaxima, imagem, publico)
VALUES
(NULL, 'Elfo', 'Vivem por séculos, enxergam bem na penumbra e têm uma ligação antiga com a magia.', 8, '../img/racas/elfo.jpg', 1),
(NULL, 'Halfling', 'Pequenos, ágeis e muito sortudos. Preferem uma boa refeição a uma boa briga.', 8, '../img/racas/halfling.jpg', 1),
(NULL, 'Humano', 'Versáteis e ambiciosos, se adaptam a qualquer lugar e aprendem qualquer ofício.', 10, '../img/racas/humano.jpg', 1),
(NULL, 'Fada', 'Seres pequenos e luminosos das florestas antigas, curiosos e imprevisíveis.', 6, '../img/racas/fada.jpg', 1),
(NULL, 'Goblin', 'Pequenos, espertos e cheios de truques. Onde ninguém vê saída, um goblin acha três.', 7, '../img/racas/goblin.jpg', 1),
(NULL, 'Centauro', 'Metade humano, metade cavalo. Fortes, rápidos e protetores das florestas.', 12, '../img/racas/centauro.jpg', 1);

-- classes oficiais (ids 1 a 6)
INSERT INTO classes
(usuarioId, nome, descricao, imagem, publico)
VALUES
(NULL, 'Guerreiro', 'Especialista em combate corpo a corpo, usa qualquer arma e armadura.', '../img/classes/guerreiro.jpg', 1),
(NULL, 'Paladino', 'Cavaleiro sagrado que junta espada e fé. Cura com as mãos.', '../img/classes/paladino.jpg', 1),
(NULL, 'Bárbaro', 'Guerreiro selvagem movido pela fúria em batalha.', '../img/classes/barbaro.jpg', 1),
(NULL, 'Ladrão', 'Ágil e discreto, abre fechaduras e some nas sombras.', '../img/classes/ladrao.jpg', 1),
(NULL, 'Clérigo', 'Servo de uma divindade, cura aliados e enfrenta mortos-vivos.', '../img/classes/clerigo.jpg', 1),
(NULL, 'Mago', 'Estudioso das artes arcanas, lança magias de um grimório.', '../img/classes/mago.jpg', 1);

-- itens (ids 1 a 11)
INSERT INTO itens
(nome, tipo, imagem)
VALUES
('Espada longa', 'Arma', '../img/itens/espada-longa.png'),
('Machado de guerra', 'Arma', '../img/itens/machado-de-guerra.png'),
('Adaga', 'Arma', '../img/itens/adaga.png'),
('Arco e flechas', 'Arma', '../img/itens/arco.png'),
('Cajado arcano', 'Arma', '../img/itens/cajado-arcano.png'),
('Maçã dourada', 'Consumível', '../img/itens/maca-dourada.png'),
('Escudo', 'Proteção', '../img/itens/escudo.png'),
('Poção de cura', 'Consumível', '../img/itens/pocao-de-cura.png'),
('Poção de mana', 'Consumível', '../img/itens/pocao-de-mana.png'),
('Grimório', 'Utilidade', '../img/itens/grimorio.png'),
('Símbolo sagrado', 'Utilidade', '../img/itens/simbolo-sagrado.png');


-- campanhas
--   1 e 2: as duas campanhas OFICIAIS da Peak
INSERT INTO campanhas
(usuarioMestreId, nome, descricao, historia, imagemCapa, codigoConvite, oficial, oficialId, criadaPor)
VALUES
(NULL, 'As Raízes do Fim', 'A água está morrendo, mas os seis princípios discordam sobre o que deve ser salvo: o rio, as pessoas, a ordem, a verdade ou a possibilidade de um futuro diferente.', '# As Raízes do Fim

Campanha de RPG de fantasia sombria • ODS 6 — Água Potável e Saneamento

Durante séculos, o reino de Valdora prosperou graças ao Rio de Elar, cujas águas alimentavam plantações, sustentavam vilas e mantinham vivas as florestas. Entretanto, com o crescimento das cidades e a expansão da mineração, o rio começou a escurecer. Os peixes morreram, as colheitas apodreceram e doenças se espalharam entre aqueles que não podiam pagar por água limpa. Enquanto os poderosos protegiam seus privilégios, a população era obrigada a sobreviver com aquilo que restava.

O reino atribuiu a tragédia a uma antiga maldição, mas a verdade era mais terrível: a própria humanidade havia envenenado aquilo que a mantinha viva.

À medida que a corrupção se espalha pelas águas e raízes, antigas entidades começam a despertar. Fim, Humano, Anjo, Luz, Justiça e Dúvida são princípios que representam forças fundamentais da existência. Cada um possui sua própria compreensão do que deve ser preservado, do que merece ser destruído e de quem deve responder pelas consequências de seus atos.

Os jogadores são enviados para investigar a origem da contaminação e acabam envolvidos em uma disputa que ultrapassa os limites do reino. Para descobrir o que realmente aconteceu, precisarão explorar vilas abandonadas, atravessar florestas corrompidas e confrontar aqueles que lucraram com a tragédia. No caminho, encontrarão criaturas deformadas pela poluição, vítimas transformadas em monstros e entidades cujas intenções nem sempre correspondem às aparências.

Entretanto, descobrir os culpados será apenas o começo. Revelar a verdade poderá provocar uma guerra; buscar justiça poderá condenar inocentes; e salvar o rio poderá exigir o fim de um sistema do qual milhares de pessoas dependem para sobreviver.

No fim, os aventureiros terão de decidir se é possível reconstruir um mundo sem repetir os erros que o destruíram — e se a humanidade merece uma segunda oportunidade.

Porque nem toda maldição nasce da magia, nem todo monstro nasce mau e nem toda salvação acontece sem sacrifícios.

A campanha aborda a importância do acesso à água potável, do saneamento, da preservação dos ecossistemas aquáticos e da responsabilidade coletiva pela proteção dos recursos naturais, relacionando sua narrativa à ODS 6 da ONU.', '../img/novas/odspoluicao.png', NULL, 1, NULL, 'Equipe Peak'),
(NULL, 'Dohomatika', 'Uma história original de um artista parceiro da Peak; César. Uma narrativa sobre a existência, a insanidade e os limites da realidade, onde até a própria inexistência pode ser temida.', 'Dohomatika é uma campanha ambientada no universo de Openworld, um conjunto que reúne as histórias de diferentes livros em uma mesma existência. Nesse universo, a realidade é habitada por seres transcendentais, criaturas extraordinárias e entidades cujos poderes ultrapassam os limites da compreensão comum. Suas histórias se entrelaçam por meio de conflitos, relações complexas e acontecimentos capazes de afetar não apenas indivíduos, mas a própria estrutura da existência.

No centro dessa narrativa está Dohomatika, uma entidade inexistente que não possui mente ou alma próprias, sendo apenas uma couraça capaz de abrigar outros seres. Sua natureza misteriosa e seu poder sem limites conhecidos fazem dele uma presença singular, capaz de apagar da realidade aqueles que ousam desafiá-lo. Entretanto, sua importância não se resume à sua força, pois seu corpo também se torna parte do destino de outras existências que nele habitam.

Entre essas figuras estão os Errantes, membros de um grupo transcendental responsáveis por narrar as histórias de Openworld. Nosa, conhecido como O Cordeiro Puro, Descendente do Clarividente, destaca-se por sua habilidade de combate e por seu papel no conflito que leva à expulsão de Zaggaz, o Canibal de Corações e pilar da insanidade. Após esse acontecimento, Zaggaz passa a vagar fora da couraça de Dohomatika, afundando cada vez mais em sua própria demência. Shade, por sua vez, é reconhecido por sua sabedoria e pelo uso de estiletes envenenados, enquanto outros Errantes ainda aguardam seu momento de revelar suas histórias.

A campanha também apresenta personagens como Mistake, filha de Lyra, cuja busca por uma filha perfeita resulta em um pacto com Exegork. Transformada em uma criatura de beleza extraordinária, capaz de salvar a existência por meio de sua voz, Mistake é condenada a carregar duas maldições: a Miséria Silenciosa e a Miséria Luxuriosa. Sua trajetória é marcada pela perda de Darek, seu filho que nunca chegou a nascer, e pela busca frustrada de consolo em Dohomatika, uma entidade incapaz de sentir. Já Dogma representa uma ameaça de natureza diferente: um conceito imortal que caça suas vítimas, regenera seus ferimentos e utiliza sua inteligência para superar adversários cada vez mais poderosos. Embora possa ser derrotado em combate, apenas Dohomatika é capaz de exterminá-lo por completo.

Cada personagem carrega sua própria natureza, seus conflitos e suas consequências, contribuindo para uma narrativa na qual poder não significa necessariamente compreensão, e imortalidade não representa ausência de sofrimento. As relações entre essas figuras moldam acontecimentos que ultrapassam suas próprias histórias, revelando diferentes perspectivas sobre a existência, a insanidade, a perda e a permanência.

Assim, Dohomatika não é apenas uma história sobre seres poderosos, mas sobre as contradições que habitam um universo onde até mesmo a realidade pode ser questionada. Em Openworld, cada existência possui seu lugar, cada conflito pode desencadear consequências imprevisíveis e nem mesmo aquilo que parece eterno está necessariamente livre de seu próprio destino.', '../img/mascote/dohomatika.png', NULL, 1, NULL, 'César');


-- monstros
--   1 a 4: oficiais gerais da Peak
--   5:     oficial da campanha Guardiões de Ágora
--   6 e 7: oficiais da campanha Dohomatika (exemplos para trocar no painel do admin)
INSERT INTO monstros
(usuarioId, campanhaOficialId, nome, imagem, descricao, vidaMaxima, defesa, publico)
VALUES
(NULL, NULL, 'Mímico', '../img/monstros/mimico.jpg', 'Parece um baú de tesouro comum até alguém tentar abri-lo.', 30, 14, 1),
(NULL, NULL, 'Bruxa', '../img/monstros/bruxa.jpg', 'Feiticeira que comanda corvos e lança maldições sombrias sobre quem cruza o seu caminho.', 26, 13, 1),
(NULL, NULL, 'Carniçal', '../img/monstros/carnical.jpg', 'Morto-vivo faminto que ronda cemitérios; suas garras paralisam.', 18, 12, 1),
(NULL, NULL, 'Lich', '../img/monstros/lich.jpg', 'Mago morto-vivo que guardou a alma num objeto para nunca morrer.', 40, 15, 1),
(NULL, 1, 'Dragão do Rio Seco', '../img/novas/dragao.jpg', 'Guarda a nascente do rio de Ágora. Ninguém sabe se ele secou o rio ou se está protegendo o que sobrou.', 60, 17, 1),
(NULL, 2, 'Exemplo da Dohomatika 1', '../img/retratos/r10.jpg', 'Monstro de exemplo. Troque o nome, a imagem e a descrição no painel do admin.', 18, 13, 1),
(NULL, 2, 'Exemplo da Dohomatika 2', '../img/retratos/r02.jpg', 'Monstro de exemplo. Troque o nome, a imagem e a descrição no painel do admin.', 14, 11, 1),
(NULL, NULL, 'Devorador de Mentes', '../img/monstros/devorador.jpg', 'Criatura com tentáculos no rosto que domina a mente das vítimas e se alimenta de cérebros.', 35, 15, 1),
(NULL, NULL, 'Espírito', '../img/monstros/espirito.jpg', 'Alma presa entre os vivos e os mortos. Atravessa paredes e só descansa quando encontra paz.', 16, 13, 1),
(NULL, NULL, 'Morte', '../img/monstros/morte.jpg', 'Ceifadora de almas que aparece quando alguém está perto do fim. Poucos a enfrentam e voltam.', 45, 16, 1),
(NULL, NULL, 'Orc', '../img/monstros/orc.jpg', 'Guerreiro forte e brutal que ataca em bandos com machados pesados.', 22, 13, 1);


