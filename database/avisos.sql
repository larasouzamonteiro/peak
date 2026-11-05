-- avisos.sql  -  rode UMA vez só (no Aiven e no MySQL do seu computador)
-- =====================================================
-- Cria só a tabela nova "avisos". Não apaga nem muda nada que já existe.
-- NÃO rode o banco.sql de novo: ele apaga o banco inteiro!
--
-- Como rodar no MySQL Workbench:
--   1. conecte no banco (Aiven ou local)
--   2. abra este arquivo (File > Open SQL Script)
--   3. clique no raio (Execute)

-- No Aiven o banco se chama projetopeak. No computador (bancolocal.sql) se chama peaklocal:
-- troque a linha de baixo para  USE peaklocal;  quando for rodar no seu computador.
USE projetopeak;

CREATE TABLE IF NOT EXISTS avisos(
    id INT AUTO_INCREMENT PRIMARY KEY,
    titulo VARCHAR(80) NOT NULL,
    texto VARCHAR(200),
    criadoEm DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- um aviso de exemplo para o Início não ficar vazio (pode apagar depois pela Administração)
INSERT INTO avisos (titulo, texto) VALUES ('Bem-vindos à Peak!', 'Criem suas fichas na Oficina e explorem o Bestiário.');
