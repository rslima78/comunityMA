-- 003_login.sql
-- O login passa a ser do proprio estudante: CPF como usuario e a data de
-- nascimento (DDMMAAAA) como senha inicial. A familia deixou de ser dona de
-- credencial e ficou so' como agrupamento de irmaos.

ALTER TABLE estudantes
  ADD COLUMN senha_hash           TEXT,
  ADD COLUMN precisa_trocar_senha BOOLEAN NOT NULL DEFAULT TRUE,
  ADD COLUMN senha_alterada_em    TIMESTAMPTZ;

-- O CPF e' a chave de login, entao dois estudantes com o mesmo CPF tornariam
-- a autenticacao ambigua. Parcial porque cadastro sem CPF continua valido --
-- esse aluno simplesmente nao consegue entrar.
CREATE UNIQUE INDEX estudantes_cpf_key ON estudantes (cpf) WHERE cpf IS NOT NULL;

-- Sessoes de administrador e de responsavel sao separadas; o admin nunca sai
-- da tabela de estudantes.
CREATE INDEX admins_usuario_idx ON admins (usuario);
