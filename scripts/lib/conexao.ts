import { config } from "dotenv";
import { Client } from "pg";
import { descreveDestino, sslParaConexao } from "../../src/lib/pg-ssl";

config({ path: ".env.local" });
config({ path: ".env" });

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
  await client.connect();
  console.log(`conectado em ${descreveDestino(connectionString)}`);
  return client;
}
