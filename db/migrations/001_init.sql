-- 001_init.sql — schema inicial do portal COMUNITYMA
-- Banco: PostgreSQL (Railway em producao, Docker local em desenvolvimento).

-- ---------------------------------------------------------------------------
-- estudantes
-- Chave de negocio: (matricula, turma). No cadastro real 16 alunos aparecem
-- com a mesma matricula em duas turmas, entao matricula sozinha nao serve.
-- ---------------------------------------------------------------------------
CREATE TABLE estudantes (
  id                SERIAL PRIMARY KEY,
  nome              TEXT NOT NULL,
  nome_normalizado  TEXT NOT NULL,
  matricula         TEXT NOT NULL,
  cpf               CHAR(11),
  serie             TEXT,
  turma             TEXT,
  nascimento        DATE,
  idade             INTEGER,
  nome_mae          TEXT,
  nome_pai          TEXT,
  criado_em         TIMESTAMPTZ NOT NULL DEFAULT now(),
  CONSTRAINT estudantes_matricula_turma_key UNIQUE (matricula, turma)
);

CREATE INDEX estudantes_cpf_idx              ON estudantes (cpf);
CREATE INDEX estudantes_turma_idx            ON estudantes (turma);
CREATE INDEX estudantes_matricula_idx        ON estudantes (matricula);
CREATE INDEX estudantes_nome_normalizado_idx ON estudantes (nome_normalizado);

-- ---------------------------------------------------------------------------
-- responsaveis  (login do portal: CPF + senha)
-- ---------------------------------------------------------------------------
CREATE TABLE responsaveis (
  id                   SERIAL PRIMARY KEY,
  cpf                  CHAR(11) NOT NULL UNIQUE,
  senha_hash           TEXT NOT NULL,
  precisa_trocar_senha BOOLEAN NOT NULL DEFAULT FALSE,
  criado_em            TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- ---------------------------------------------------------------------------
-- responsavel_estudante  (juncao: um responsavel pode ter varios estudantes)
-- ---------------------------------------------------------------------------
CREATE TABLE responsavel_estudante (
  responsavel_id INTEGER NOT NULL REFERENCES responsaveis (id) ON DELETE CASCADE,
  estudante_id   INTEGER NOT NULL REFERENCES estudantes  (id) ON DELETE CASCADE,
  criado_em      TIMESTAMPTZ NOT NULL DEFAULT now(),
  PRIMARY KEY (responsavel_id, estudante_id)
);

CREATE INDEX responsavel_estudante_estudante_idx ON responsavel_estudante (estudante_id);

-- ---------------------------------------------------------------------------
-- admins  (login do administrador; semeado por env var, nunca pela planilha)
-- ---------------------------------------------------------------------------
CREATE TABLE admins (
  id         SERIAL PRIMARY KEY,
  usuario    TEXT NOT NULL UNIQUE,
  senha_hash TEXT NOT NULL,
  criado_em  TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- ---------------------------------------------------------------------------
-- notas  (um registro por estudante x disciplina x periodo)
-- ---------------------------------------------------------------------------
CREATE TABLE notas (
  id           SERIAL PRIMARY KEY,
  estudante_id INTEGER NOT NULL REFERENCES estudantes (id) ON DELETE CASCADE,
  disciplina   TEXT NOT NULL,
  unidade1     NUMERIC(5,2),
  unidade2     NUMERIC(5,2),
  unidade3     NUMERIC(5,2),
  media_anual  NUMERIC(5,2),
  exame_final  NUMERIC(5,2),
  media_final  NUMERIC(5,2),
  periodo      TEXT NOT NULL,
  CONSTRAINT notas_estudante_disciplina_periodo_key
    UNIQUE (estudante_id, disciplina, periodo)
);

CREATE INDEX notas_estudante_idx ON notas (estudante_id);

-- ---------------------------------------------------------------------------
-- ocorrencias
-- ---------------------------------------------------------------------------
CREATE TABLE ocorrencias (
  id           SERIAL PRIMARY KEY,
  estudante_id INTEGER NOT NULL REFERENCES estudantes (id) ON DELETE CASCADE,
  tipo         TEXT NOT NULL,
  descricao    TEXT,
  data         DATE
);

CREATE INDEX ocorrencias_estudante_idx ON ocorrencias (estudante_id, data DESC);

-- ---------------------------------------------------------------------------
-- frequencia  (totais acumulados por periodo, sem detalhe por disciplina)
-- ---------------------------------------------------------------------------
CREATE TABLE frequencia (
  id           SERIAL PRIMARY KEY,
  estudante_id INTEGER NOT NULL REFERENCES estudantes (id) ON DELETE CASCADE,
  total_aulas  INTEGER,
  total_faltas INTEGER,
  periodo      TEXT NOT NULL,
  CONSTRAINT frequencia_estudante_periodo_key UNIQUE (estudante_id, periodo)
);

-- ---------------------------------------------------------------------------
-- avisos  (criados pelo admin dentro do sistema)
-- Destino exclusivo: OU turma inteira OU um estudante -- nunca os dois,
-- nunca nenhum. Garantido pelo banco, nao so pela aplicacao.
-- ---------------------------------------------------------------------------
CREATE TABLE avisos (
  id             SERIAL PRIMARY KEY,
  titulo         TEXT NOT NULL,
  mensagem       TEXT NOT NULL,
  data_envio     TIMESTAMPTZ NOT NULL DEFAULT now(),
  autor_admin_id INTEGER NOT NULL REFERENCES admins (id) ON DELETE RESTRICT,
  turma          TEXT,
  estudante_id   INTEGER REFERENCES estudantes (id) ON DELETE CASCADE,
  CONSTRAINT avisos_destino_exclusivo CHECK (
    (turma IS NOT NULL AND estudante_id IS NULL)
    OR
    (turma IS NULL AND estudante_id IS NOT NULL)
  )
);

CREATE INDEX avisos_turma_idx     ON avisos (turma, data_envio DESC);
CREATE INDEX avisos_estudante_idx ON avisos (estudante_id, data_envio DESC);
