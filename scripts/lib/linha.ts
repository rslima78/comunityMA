import type { Executor } from "../../src/lib/casamento";

/**
 * Roda a gravacao de uma linha isolada do resto da importacao.
 *
 * No Postgres, qualquer erro dentro de uma transacao a deixa em estado
 * abortado: dali em diante todo comando falha com "current transaction is
 * aborted". Ou seja, sem isto, uma unica linha com valor invalido derrubaria
 * a planilha inteira, mesmo que as outras 800 estivessem perfeitas.
 *
 * O SAVEPOINT cria um ponto de retorno por linha. Se a linha falha, volta-se
 * so' ate ali, a transacao segue viva e o problema vira pendencia no
 * relatorio -- que e' a regra do projeto: nunca falhar em silencio, mas
 * tambem nunca perder o que estava bom.
 *
 * Devolve o erro (para virar pendencia) ou null quando deu certo.
 */
export async function gravarLinha(
  db: Executor,
  acao: () => Promise<void>
): Promise<Error | null> {
  // Fora de uma transacao nao ha' o que marcar: cada comando ja' vale por si,
  // e uma linha que falha nao afeta as outras. O importador continua correto
  // chamado dos dois jeitos.
  let dentroDeTransacao = true;
  try {
    await db.query("SAVEPOINT linha_atual");
  } catch (erro) {
    if ((erro as { code?: string })?.code !== SEM_TRANSACAO) throw erro;
    dentroDeTransacao = false;
  }

  try {
    await acao();
    if (dentroDeTransacao) await db.query("RELEASE SAVEPOINT linha_atual");
    return null;
  } catch (erro) {
    if (dentroDeTransacao) await db.query("ROLLBACK TO SAVEPOINT linha_atual");
    return erro instanceof Error ? erro : new Error(String(erro));
  }
}

/** Postgres: "there is no transaction in progress". */
const SEM_TRANSACAO = "25P01";

/** Primeira linha da mensagem do Postgres, sem a pilha e sem o SQL inteiro. */
export function motivoCurto(erro: Error): string {
  const detalhe = (erro as { detail?: string }).detail;
  const texto = detalhe ? `${erro.message} (${detalhe})` : erro.message;
  return texto.split("\n")[0].slice(0, 200);
}
