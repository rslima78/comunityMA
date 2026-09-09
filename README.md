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

Cada arquivo roda dentro de uma transacao, e cada linha dentro de um
SAVEPOINT: uma linha com valor invalido vira pendencia no relatorio e as
outras continuam entrando. Sem o savepoint, um unico erro deixaria a
transacao em estado abortado e derrubaria a planilha inteira.

Arquivo que nao da' para interpretar -- um .xlsx renomeado para .csv, por
exemplo -- para antes de gravar qualquer coisa, com uma mensagem dizendo qual
arquivo e por que.

Rodar o mesmo arquivo duas vezes nao duplica nada.

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
- **troca de senha opcional.** Quem ainda usa a senha inicial entra normalmente
  e ve um aviso no topo do portal convidando a trocar; o link tambem fica no
  rodape para quem quiser trocar de novo depois. Prender a familia numa tela
  de senha antes de deixar ver as notas afastaria justamente quem menos tem
  intimidade com o sistema
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

Nao existe cadastro publico de admin. O usuario vem de variavel de ambiente:

```bash
npm run seed-admin
```

Le `ADMIN_USER` e `ADMIN_PASSWORD`. Rodar de novo com senha diferente troca a
senha do usuario.

**No Railway isso roda sozinho a cada deploy** (ver `railway.json`), com
`--opcional`: sem as variaveis definidas, o comando avisa e sai bem, sem
impedir a aplicacao de subir. Ou seja, para criar ou trocar a senha do admin
em producao, basta definir `ADMIN_USER` e `ADMIN_PASSWORD` nas Variables do
servico e redeployar -- nao e' preciso acesso direto ao banco.

Como o seed roda no boot, **as variaveis sao a fonte da verdade da senha do
admin**: mudou a variavel, mudou a senha no proximo deploy.

### Tela do responsavel — `/portal`

Pagina unica, somente leitura, mobile-first, com atalhos para as quatro
secoes no topo:

1. **Avisos** (em destaque) — os individuais do estudante mais os da turma
   dele, misturados por data, mais recente primeiro. A turma e' lida na hora
   do cadastro: aluno que muda de turma passa a ver os avisos da turma nova.
2. **Faltas** — mostra a **frequencia**, e nao o percentual de faltas, porque
   e' esse o numero que a Secretaria usa. Quatro faixas:

   | frequencia | etiqueta | recado |
   | --- | --- | --- |
   | ate 25% | Reprovado por faltas | vermelho, "procure a escola com urgencia" |
   | ate 35% | Frequencia critica | vermelho, alerta de proximidade do limite |
   | ate 50% | Frequencia baixa | amarelo |
   | acima | Sem reprovacao por faltas | verde |

   Só a primeira faixa vem da Secretaria (`FREQUENCIA_REPROVACAO_DIRETA`); as
   outras duas sao reguas da escola para a familia perceber a queda antes de
   virar reprovacao, e por isso o texto delas alerta sem afirmar reprovacao.
   A regra dos 25% aparece escrita nas quatro faixas.

   Uma falta e' de **uma aula**, nao de um dia, entao o cartao mostra as duas
   medidas: "235 faltas (47 dias)". Quando o arquivo importado traz o total de
   aulas dadas, o percentual sai dele; quando nao traz -- o caso dos arquivos
   por turma --, sai de `faltas / 5` dias sobre `70` dias letivos. As
   constantes ficam no inicio de `src/lib/portal.ts`.
3. **Notas** — um cartao por disciplina, com Unidade 1/2/3, Media Anual,
   Exame Final e Media Final. Nota abaixo de 5,0 aparece em vermelho.

   As disciplinas sao agrupadas por area -- Linguagens, Humanas, Natureza e
   Matematica, Diversificadas. O casamento e' por trecho do nome normalizado
   (`src/lib/areas.ts`), e nao por lista fechada, porque a grade muda entre
   fundamental, EJA e curso tecnico: "LINGUA PORTUGUESA" e "PORTUGUES" caem no
   mesmo grupo, e o que nao casa vai para Diversificadas em vez de sumir.
4. **Ocorrencias** — tipo, data e descricao, mais recente primeiro, com cor
   por gravidade.

5. **Falar com a escola** — secretaria e direcao, cada um como link de
   conversa no WhatsApp ja' com uma apresentacao escrita ("Sou responsavel
   pelo estudante X da turma Y"), para quem atende nao precisar perguntar de
   quem se trata. A lista fica em `src/lib/contatos.ts`.

Cada secao tem cabecalho colorido com icone. A cor e' identidade do bloco,
nao significado: quem carrega estado continua sendo o cartao (vermelho de
reprovacao, amarelo de atencao). As cores ficam em `:root` no `globals.css`,
fora do `@theme` -- dentro dele o Tailwind as removeria, por serem montadas em
tempo de execucao e nunca aparecerem escritas numa classe.

Avisos do proprio sistema -- como o convite para trocar a senha inicial --
ficam no **fim** da pagina: o recado da escola vem antes do recado do
aplicativo.

Tudo e' buscado pelo id que veio da sessao assinada; nao existe parametro de
estudante na URL para alguem trocar.

**Nota que nao foi lancada aparece como travessao (—), nunca como zero.** O
SIGEDUC exporta `0,0` em Media Anual, Exame Final e Media Final enquanto o ano
nao fecha. Mostrar isso faria toda familia ver zero em vermelho em todas as
disciplinas no meio do ano. A regra: o zero so' e' escondido quando contradiz
as unidades -- se o aluno tem 5 e 7 nas unidades, uma media anual 0 nao foi
calculada; se as unidades dele tambem sao 0, o zero e' real e aparece.

A media de aprovacao e a linha de corte de faltas ficam em constantes no
inicio de `src/lib/portal.ts`.

### Reimportar planilhas — `/admin/importar`

Para quando chegam planilhas atualizadas (nova unidade, novo bimestre), sem
precisar de terminal:

- **cadastro de estudantes** (.xlsx) cria os alunos novos, atualiza os
  existentes e gera as senhas iniciais de quem ainda nao tem -- sem tocar na
  senha de quem ja trocou
- **notas** e **ocorrencias** aceitam varias turmas de uma vez; a turma sai do
  nome do arquivo, entao os arquivos nao podem ser renomeados
- **frequencia** e' o arquivo unico da escola
- cada arquivo tem a sua propria transacao: um corrompido nao desfaz os que ja
  entraram
- o resultado aparece na hora, com os contadores e a lista de linhas que nao
  entraram

Assim a escola opera tudo pelo navegador: o banco nao precisa ficar acessivel
de fora, e ninguem precisa de terminal.

### Painel de avisos — `/admin`

Atras do login de admin, na mesma tela:

- **compor** titulo (ate 120 caracteres) e mensagem (ate 2000)
- **escolher o destino**: uma turma inteira, escolhida entre as turmas que
  existem no cadastro, com a quantidade de estudantes de cada uma; ou um
  estudante, buscado por nome ou matricula
- **enviar**, com `data_envio` preenchida pelo banco
- **historico** dos ultimos 50, mais recente primeiro, com o destino em
  destaque: azul para turma (com o alcance) e verde para estudante

Um aviso tem sempre um unico destino -- turma **ou** estudante. Isso e'
garantido por CHECK no banco, nao so pela tela.

Nao ha edicao nem exclusao de aviso, e nao ha confirmacao de leitura.

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
4. O administrador e as migrations sao aplicados automaticamente no boot.
5. Importe o cadastro e as planilhas por `/admin/importar`.

## Etapas

- [x] **1** — modelagem de dados e setup inicial
- [x] **2** — importacao das planilhas
- [x] **3** — login do responsavel e do administrador
- [x] **4** — painel de avisos do administrador
- [x] **5** — tela de consulta do responsavel
- [x] **6** — polimento: erros de importacao e tela de reimportacao
