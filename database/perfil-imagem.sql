-- perfil-imagem.sql  (nov/2026)
-- A imagem do lado do "Sobre mim" no perfil fica numa coluna nova da tabela usuarios.
-- Rode SÓ esta linha, UMA vez, no banco (Aiven e, se quiser, no peaklocal).
-- NÃO precisa rodar o banco.sql de novo.

ALTER TABLE usuarios ADD imagemSobre LONGTEXT;
