import { Pool } from "pg";
import { sslParaConexao } from "./pg-ssl";

const connectionString = process.env.DATABASE_URL;

if (!connectionString) {
  throw new Error(
    "DATABASE_URL nao definida. Copie .env.example para .env.local e preencha."
  );
}

// Em dev o Next recarrega os modulos a cada edicao; sem o cache global isso
// abriria um pool novo por reload ate estourar o limite de conexoes.
const globalForDb = globalThis as unknown as { pool?: Pool };

export const pool =
  globalForDb.pool ??
  new Pool({
    connectionString,
    ssl: sslParaConexao(connectionString),
    max: 10,
  });

if (process.env.NODE_ENV !== "production") {
  globalForDb.pool = pool;
}

export async function query<T extends Record<string, unknown>>(
  text: string,
  params?: unknown[]
) {
  const result = await pool.query<T>(text, params);
  return result.rows;
}
