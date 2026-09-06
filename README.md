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
cp .env.example .env.local   # ajuste DATABASE_URL e gere a SESSION_SECRET
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

## Importacao das planilhas

```bash
npm run importar -- estudantes  "estudantes.xlsx"
npm run importar -- notas       "Notas - 6ºA.csv"    --periodo=2026
npm run importar -- ocorrencias "Ocorrencias 6A.csv"
npm run importar -- frequencia  "frequencia.csv"     --periodo=2026
npm run importar -- senhas
```

Notas e ocorrencias sao um arquivo por turma; a turma sai do nome do arquivo,
porque nenhum dos dois CSVs traz essa coluna. Importar `estudantes` ja define
as senhas iniciais de quem ainda nao tem.

Cada comando roda dentro de uma transacao: ou a planilha inteira entra, ou
nada entra. Rodar o mesmo arquivo duas vezes nao duplica nada.

**Ordem obrigatoria:** `estudantes` primeiro. Notas, ocorrencias e frequencia
so' conseguem casar com alunos que ja existem no banco.

### Casamento de dados

Os arquivos da escola nao compartilham um identificador confiavel, entao a
busca do estudante tenta, nesta ordem:

1. matricula exata
2. matricula sem zeros a esquerda
3. nome normalizado (maiusculo, sem acento), restrito a turma quando ela e'
   conhecida

Se nada casar, ou se houver mais de um candidato, a linha vira **pendencia**:
nunca e' feito um chute. Ao final o comando imprime quantas foram e grava o
detalhe em `relatorios/`, que fica fora do git por conter nomes de alunos.

## Acesso

Dois perfis, com sessoes separadas: um cookie de responsavel nao vale como
admin nem o contrario, porque o escopo entra na assinatura.

### Responsavel / estudante — `/login`

- **usuario:** CPF do estudante
- **senha inicial:** data de nascimento no formato `DDMMAAAA`
- troca de senha **obrigatoria** no primeiro acesso, antes de qualquer tela
- **um login da acesso a exatamente um estudante.** Responsavel com mais de um
  filho entra com o CPF de cada um, um de cada vez. Nao existe agrupamento por
  familia: ele dependeria dos nomes de mae e pai digitados na secretaria, e um
  homonimo ali viraria acesso ao dado do filho de outra pessoa
- erro sempre generico ("CPF ou senha invalidos"), e o tempo de resposta e' o
  mesmo para CPF inexistente e senha errada, para nao revelar quem estuda aqui
- 8 tentativas por CPF e IP a cada 15 minutos

As senhas iniciais entram junto com o cadastro. Para gerar apenas as que
faltam, sem tocar em quem ja trocou a senha:

```bash
npm run importar -- senhas
```

### Administrador — `/admin/login`

Nao existe cadastro publico de admin. O usuario inicial vem de variavel de
ambiente:

```bash
npm run seed-admin
```

Le `ADMIN_USER` e `ADMIN_PASSWORD`. Rodar de novo com senha diferente troca a
senha do usuario.

### Senhas e sessao

Hash com **scrypt** do proprio Node -- sem dependencia nativa para compilar no
Railway. Os parametros ficam gravados junto do hash, entao podem mudar depois
sem invalidar as senhas existentes.

A sessao e' um cookie `httpOnly` assinado com HMAC-SHA256 usando
`SESSION_SECRET`, valido por 8 horas. Trocar essa variavel desconecta todo
mundo.

## Modelo de dados

| tabela | conteudo |
| --- | --- |
| `estudantes` | cadastro vindo de `estudantes.xlsx`; chave `(matricula, turma)`; guarda tambem o login (CPF unico) e a senha |
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
2. No servico da aplicacao, defina:
   - `DATABASE_URL` = `${{Postgres.DATABASE_URL}}`
   - `SESSION_SECRET` = 64 caracteres aleatorios
   - `ADMIN_USER` e `ADMIN_PASSWORD`
3. As migrations rodam sozinhas a cada deploy (ver `railway.json`).
4. Rode `npm run seed-admin` uma vez para criar o administrador.

## Etapas

- [x] **1** — modelagem de dados e setup inicial
- [x] **2** — importacao das planilhas
- [x] **3** — login do responsavel e do administrador
- [ ] 4 a 6 — a definir pelo Robson, uma de cada vez
