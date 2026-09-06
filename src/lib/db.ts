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

/** Banco fora do ar ou inalcancavel -- diferente de erro de SQL. */
export class BancoIndisponivel extends Error {
  constructor(causa: unknown) {
    super("Nao foi possivel conectar ao banco de dados.", { cause: causa });
    this.name = "BancoIndisponivel";
  }
}

/**
 * Quando o Postgres nao responde, o driver lanca um AggregateError com
 * `message` vazia (uma tentativa por IPv4 e outra por IPv6). Isso chega na
 * tela como "no message was provided", sem dizer nada a ninguem -- por isso
 * a falha de conexao vira um erro proprio, com texto.
 */
function ehFalhaDeConexao(erro: unknown): boolean {
  const codigosDeRede = new Set([
    "ECONNREFUSED",
    "ENOTFOUND",
    "ETIMEDOUT",
    "EHOSTUNREACH",
    "ENETUNREACH",
    "ECONNRESET",
    "EPIPE",
  ]);

  const codigo = (erro as { code?: string })?.code;
  if (codigo && codigosDeRede.has(codigo)) return true;

  if (erro instanceof AggregateError) {
    return erro.errors.some((e) => codigosDeRede.has((e as { code?: string })?.code ?? ""));
  }

  return false;
}

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

  // Sem este ouvinte, uma conexao ociosa que cai derruba o processo inteiro.
  pool.on("error", (erro) => {
    console.error("[banco] conexao ociosa caiu:", erro.message);
  });

  globalParaDb.poolMA = pool;
  return pool;
}

export async function query<T = Record<string, unknown>>(
  texto: string,
  parametros?: unknown[]
): Promise<T[]> {
  try {
    const resultado = await obterPool().query(texto, parametros as unknown[]);
    return resultado.rows as T[];
  } catch (erro) {
    if (ehFalhaDeConexao(erro)) {
      console.error("[banco] indisponivel:", descreverErro(erro));
      throw new BancoIndisponivel(erro);
    }
    throw erro;
  }
}

function descreverErro(erro: unknown): string {
  if (erro instanceof AggregateError) {
    return erro.errors
      .map((e) => (e as Error)?.message ?? String(e))
      .join(" | ");
  }
  return (erro as Error)?.message ?? String(erro);
}

/**
 * A mesma conexao, no formato que as funcoes de consulta esperam. Existir em
 * duas formas permite que essas funcoes rodem contra um Postgres de teste sem
 * mudar nada no codigo de producao.
 */
export const bancoPrincipal = {
  async query<T = Record<string, unknown>>(
    texto: string,
    parametros?: unknown[]
  ): Promise<{ rows: T[] }> {
    return { rows: await query<T>(texto, parametros) };
  },
};

/**
 * Roda um bloco dentro de uma transacao, numa conexao dedicada.
 *
 * BEGIN/COMMIT direto no pool nao funciona: cada query pode sair por uma
 * conexao diferente, e o COMMIT acabaria em outra conexao que nunca viu o
 * BEGIN. Por isso a conexao e' reservada e devolvida no fim.
 */
export async function comTransacao<T>(
  acao: (db: {
    query<R = Record<string, unknown>>(
      texto: string,
      parametros?: unknown[]
    ): Promise<{ rows: R[] }>;
  }) => Promise<T>
): Promise<T> {
  const cliente = await obterPool().connect();

  const executor = {
    async query<R = Record<string, unknown>>(
      texto: string,
      parametros?: unknown[]
    ): Promise<{ rows: R[] }> {
      const resultado = await cliente.query(texto, parametros as unknown[]);
      return { rows: resultado.rows as R[] };
    },
  };

  try {
    await cliente.query("BEGIN");
    const resultado = await acao(executor);
    await cliente.query("COMMIT");
    return resultado;
  } catch (erro) {
    await cliente.query("ROLLBACK");
    throw erro;
  } finally {
    cliente.release();
  }
}
