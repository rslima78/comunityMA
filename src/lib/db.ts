import { Pool } from "pg";
import { sslParaConexao } from "./pg-ssl";

/**
 * Pool do Postgres, criado na primeira consulta e nao na importacao do
 * modulo: durante o build o Next carrega as rotas sem que DATABASE_URL
 * precise existir, e um erro aqui derrubaria o build inteiro.
 *
 * Em desenvolvimento o Next recarrega os modulos a cada edicao; sem o cache
 * global, cada reload abriria um pool novo ate estourar o limite de conexoes.
 */
const globalParaDb = globalThis as unknown as { poolMA?: Pool };

function obterPool(): Pool {
  if (globalParaDb.poolMA) return globalParaDb.poolMA;

  const connectionString = process.env.DATABASE_URL;
  if (!connectionString) {
    throw new Error(
      "DATABASE_URL nao definida. Copie .env.example para .env.local e preencha."
    );
  }

  const pool = new Pool({
    connectionString,
    ssl: sslParaConexao(connectionString),
    max: 10,
  });

  globalParaDb.poolMA = pool;
  return pool;
}

export async function query<T = Record<string, unknown>>(
  texto: string,
  parametros?: unknown[]
): Promise<T[]> {
  const resultado = await obterPool().query(texto, parametros as unknown[]);
  return resultado.rows as T[];
}
