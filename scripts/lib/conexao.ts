import { config } from "dotenv";
import { Client } from "pg";
import { descreveDestino, sslParaConexao } from "../../src/lib/pg-ssl";

config({ path: ".env.local" });
config({ path: ".env" });

/**
 * Quando o Postgres nao responde, o driver lanca um AggregateError de message
 * vazia -- uma tentativa por IPv4 e outra por IPv6. Sem desempacotar, o
 * comando morre sem dizer nada, e quem esta importando planilha nao descobre
 * se errou a senha, o host ou se o banco esta' fora.
 */
function explicar(erro: unknown): string {
  if (erro instanceof AggregateError) {
    const motivos = erro.errors
      .map((e) => (e as Error)?.message ?? String(e))
      .filter(Boolean);
    return motivos.length > 0 ? motivos.join(" | ") : "conexao recusada";
  }
  const mensagem = (erro as Error)?.message;
  return mensagem && mensagem.trim() !== "" ? mensagem : String(erro);
}

export async function conectar() {
  const connectionString = process.env.DATABASE_URL;
  if (!connectionString) {
    console.error(
      "\n  DATABASE_URL nao definida. Copie .env.example para .env.local.\n"
    );
    process.exit(1);
  }

  const client = new Client({
    connectionString,
    ssl: sslParaConexao(connectionString),
  });

  const destino = descreveDestino(connectionString);

  try {
    await client.connect();
  } catch (erro) {
    console.error(
      `\n  Nao foi possivel conectar em ${destino}.\n` +
        `  Motivo: ${explicar(erro)}\n\n` +
        "  Confira se o banco esta no ar e se a DATABASE_URL do .env.local\n" +
        "  aponta para ele. Nenhum dado foi alterado.\n"
    );
    process.exit(1);
  }

  console.log(`conectado em ${destino}`);
  return client;
}
