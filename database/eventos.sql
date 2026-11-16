-- eventos.sql
-- Eventos de tema (Natal)
-- Rodar UMA vez no Aiven (o peaklocal já está pronto).
-- PRO AIVENNNNNNNNNNNNNNNNNNNNNN
-- os eventos que o admin cria
CREATE TABLE eventos(
    id INT AUTO_INCREMENT PRIMARY KEY,
    titulo VARCHAR(80) NOT NULL,
    novidade TEXT,
    tema ENUM('natal') NOT NULL,
    inicio DATETIME NOT NULL,
    fim DATETIME NOT NULL,
    desafioTitulo VARCHAR(80),
    desafioTexto TEXT,
    desafioImagem LONGTEXT
);

-- quem já abriu o presente de cada evento
CREATE TABLE eventos_vistos(
    usuarioId INT NOT NULL,
    eventoId INT NOT NULL,
    PRIMARY KEY (usuarioId, eventoId),
    FOREIGN KEY (usuarioId) REFERENCES usuarios(id) ON DELETE CASCADE,
    FOREIGN KEY (eventoId) REFERENCES eventos(id) ON DELETE CASCADE
);

-- a "etiqueta" de tema (vazio = aparece sempre)
ALTER TABLE campanhas ADD tema VARCHAR(20) NULL;
ALTER TABLE racas     ADD tema VARCHAR(20) NULL;
ALTER TABLE classes   ADD tema VARCHAR(20) NULL;
ALTER TABLE monstros  ADD tema VARCHAR(20) NULL;


-- quem ganhou o retrato de presente de cada tema (fica para sempre)
CREATE TABLE retratos_ganhos(
    usuarioId INT NOT NULL,
    tema VARCHAR(20) NOT NULL,
    ganhoEm DATETIME NOT NULL,
    PRIMARY KEY (usuarioId, tema),
    FOREIGN KEY (usuarioId) REFERENCES usuarios(id) ON DELETE CASCADE
);