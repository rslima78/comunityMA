-- 002_familias.sql
-- Agrupamento de irmaos por filiacao. A familia NAO tem CPF nem senha:
-- e' so' agrupamento. O login fica no estudante (Etapa 3).

CREATE TABLE familias (
  id        SERIAL PRIMARY KEY,
  -- nomes como vieram da planilha, para exibicao
  nome_mae  TEXT,
  nome_pai  TEXT,
  -- chave de agrupamento: mae e pai normalizados (maiusculo, sem acento).
  -- E' o que decide se dois estudantes sao da mesma familia.
  chave     TEXT NOT NULL UNIQUE,
  criado_em TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- estudante_id e' a chave primaria, e nao o par: cada estudante pertence a
-- exatamente uma familia. O formato de tabela de juncao fica mantido caso
-- um dia seja preciso mais de uma.
CREATE TABLE estudante_familia (
  estudante_id INTEGER PRIMARY KEY REFERENCES estudantes (id) ON DELETE CASCADE,
  familia_id   INTEGER NOT NULL     REFERENCES familias   (id) ON DELETE CASCADE,
  criado_em    TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX estudante_familia_familia_idx ON estudante_familia (familia_id);
