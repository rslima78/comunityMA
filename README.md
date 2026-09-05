# Portal COMUNITYMA

Portal mobile-first para responsaveis e estudantes consultarem **notas, faltas,
ocorrencias e avisos** de um aluno, e para o administrador **enviar avisos**
por turma ou individuais.

- **Stack:** Next.js 16 (App Router) + TypeScript + Tailwind v4
- **Banco:** PostgreSQL (Railway em producao, Docker local em desenvolvimento)
- **Login do responsavel:** CPF do aluno + data de nascimento como senha inicial
- **Login do admin:** usuario e senha proprios, semeados por variavel de ambiente

## Rodando localmente

```bash
npm install
cp .env.example .env.local   # ajuste DATABASE_URL se precisar
npm run db:up                # sobe o Postgres em localhost:5433
npm run migrate              # cria o schema
npm run dev                  # http://localhost:3000
```

No Windows, `iniciar.bat` faz os tres ultimos passos de uma vez.

Para apontar direto ao banco do Railway em vez do local, basta trocar a
`DATABASE_URL` no `.env.local` — o SSL e' ligado automaticamente para hosts
que nao sejam `localhost`.

## Scripts

| comando | o que faz |
| --- | --- |
| `npm run dev` | sobe o app em desenvolvimento |
| `npm run build` / `npm start` | build e execucao de producao |
| `npm run migrate` | aplica as migrations pendentes de `db/migrations` |
| `npm run db:up` / `npm run db:down` | liga/desliga o Postgres local |
| `npm run lint` | eslint |

## Migrations

Arquivos `.sql` em `db/migrations`, aplicados em ordem alfabetica, cada um
dentro de uma transacao e registrado em `_migrations`. Rodar `npm run migrate`
de novo e' seguro: o que ja foi aplicado e' ignorado.

Para uma alteracao de schema, crie `002_descricao.sql` — nunca edite uma
migration ja aplicada.

## Modelo de dados

| tabela | conteudo |
| --- | --- |
| `estudantes` | cadastro vindo de `estudantes.xlsx`; chave `(matricula, turma)` |
| `responsaveis` | login por CPF, senha em hash |
| `responsavel_estudante` | juncao responsavel -> estudante(s) |
| `admins` | login do administrador |
| `notas` | uma linha por estudante x disciplina x periodo |
| `ocorrencias` | tipo, descricao e data |
| `frequencia` | totais de aulas e faltas por periodo |
| `avisos` | destino exclusivo: turma **ou** estudante, garantido por CHECK |

## Dados reais

As planilhas e CSVs da escola contem dados pessoais de menores e **nao vao para
o repositorio** — o `.gitignore` bloqueia `*.xlsx`, `*.xls` e `*.csv`.

## Deploy no Railway

1. Provisione o plugin **Postgres**.
2. No servico da aplicacao, defina `DATABASE_URL` (referencia a variavel do
   plugin), `ADMIN_USER` e `ADMIN_PASSWORD`.
3. Rode `npm run migrate` uma vez apontando para o banco do Railway.

## Etapas

- [x] **1** — modelagem de dados e setup inicial
- [ ] 2 a 6 — a definir pelo Robson, uma de cada vez
