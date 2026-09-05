/**
 * Executa as migrations de db/migrations em ordem alfabetica.
 * Cada arquivo roda uma unica vez, dentro de uma transacao, e fica
 * registrado em _migrations. Rodar de novo e' seguro (no-op).
 *
 *   npm run migrate
 */
import { readdirSync, readFileSync } from "node:fs";
import { join } from "node:path";
import { config } from "dotenv";
import { Client } from "pg";
import { descreveDestino, sslParaConexao } from "../src/lib/pg-ssl";

config({ path: ".env.local" });
config({ path: ".env" });

const MIGRATIONS_DIR = join(process.cwd(), "db", "migrations");

async function main() {
  const connectionString = process.env.DATABASE_URL;
  if (!connectionString) {
    console.error(
      "\n  DATABASE_URL nao definida.\n" +
        "  Copie .env.example para .env.local e preencha a string de conexao.\n"
    );
    process.exit(1);
  }

  const client = new Client({
    connectionString,
    ssl: sslParaConexao(connectionString),
  });

  await client.connect();
  console.log(`conectado em ${descreveDestino(connectionString)}`);

  await client.query(`
    CREATE TABLE IF NOT EXISTS _migrations (
      nome       TEXT PRIMARY KEY,
      aplicada_em TIMESTAMPTZ NOT NULL DEFAULT now()
    )
  `);

  const aplicadas = new Set(
    (await client.query<{ nome: string }>("SELECT nome FROM _migrations")).rows.map(
      (r) => r.nome
    )
  );

  const arquivos = readdirSync(MIGRATIONS_DIR)
    .filter((f) => f.endsWith(".sql"))
    .sort();

  let novas = 0;

  for (const arquivo of arquivos) {
    if (aplicadas.has(arquivo)) {
      console.log(`  ja aplicada  ${arquivo}`);
      continue;
    }

    const sql = readFileSync(join(MIGRATIONS_DIR, arquivo), "utf8");

    try {
      await client.query("BEGIN");
      await client.query(sql);
      await client.query("INSERT INTO _migrations (nome) VALUES ($1)", [arquivo]);
      await client.query("COMMIT");
      console.log(`  aplicada     ${arquivo}`);
      novas++;
    } catch (erro) {
      await client.query("ROLLBACK");
      console.error(`\n  FALHOU       ${arquivo}\n`);
      throw erro;
    }
  }

  await client.end();
  console.log(
    novas === 0
      ? "\nbanco ja estava atualizado."
      : `\n${novas} migration(s) aplicada(s).`
  );
}

main().catch((erro) => {
  console.error(erro);
  process.exit(1);
});
