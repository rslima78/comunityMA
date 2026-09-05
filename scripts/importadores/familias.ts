import type { Executor } from "../../src/lib/casamento";
import { chaveFamilia } from "../../src/lib/normalizar";
import { Relatorio } from "../lib/relatorio";

/** Acima disso, o agrupamento provavelmente juntou familias diferentes. */
const FILHOS_SUSPEITO = 5;

/**
 * Reconstroi as familias a partir da filiacao dos estudantes.
 *
 * Dois estudantes com a mesma mae e o mesmo pai (normalizados) sao da mesma
 * familia. A familia e' so' agrupamento: nao tem CPF nem senha, e nao da'
 * acesso a nada -- o login fica no estudante. Por isso um agrupamento errado
 * por homonimo nao expoe dados de ninguem, mas ainda assim e' sinalizado.
 *
 * Roda inteiro, toda vez: e' idempotente e barato para menos de mil alunos.
 */
export async function importarFamilias(db: Executor) {
  const relatorio = new Relatorio("Agrupamento de familias");

  const { rows: estudantes } = await db.query<{
    id: number;
    nome: string;
    nome_mae: string | null;
    nome_pai: string | null;
  }>("SELECT id, nome, nome_mae, nome_pai FROM estudantes ORDER BY id");

  relatorio.contar("estudantes lidos", estudantes.length);

  const grupos = new Map<
    string,
    { nome_mae: string | null; nome_pai: string | null; ids: number[]; nomes: string[] }
  >();

  for (const estudante of estudantes) {
    const chave = chaveFamilia(estudante.nome_mae, estudante.nome_pai);

    if (chave === null) {
      relatorio.pendencia(
        `${estudante.nome} (id ${estudante.id}) sem nome de mae e sem nome de pai -- ficou sem familia`
      );
      continue;
    }

    const grupo = grupos.get(chave);
    if (grupo) {
      grupo.ids.push(estudante.id);
      grupo.nomes.push(estudante.nome);
    } else {
      grupos.set(chave, {
        nome_mae: estudante.nome_mae,
        nome_pai: estudante.nome_pai,
        ids: [estudante.id],
        nomes: [estudante.nome],
      });
    }
  }

  for (const [chave, grupo] of grupos) {
    const { rows } = await db.query<{ id: number }>(
      `INSERT INTO familias (nome_mae, nome_pai, chave)
       VALUES ($1, $2, $3)
       ON CONFLICT (chave) DO UPDATE
         SET nome_mae = EXCLUDED.nome_mae, nome_pai = EXCLUDED.nome_pai
       RETURNING id`,
      [grupo.nome_mae, grupo.nome_pai, chave]
    );
    const familiaId = rows[0].id;

    for (const estudanteId of grupo.ids) {
      await db.query(
        `INSERT INTO estudante_familia (estudante_id, familia_id)
         VALUES ($1, $2)
         ON CONFLICT (estudante_id) DO UPDATE SET familia_id = EXCLUDED.familia_id`,
        [estudanteId, familiaId]
      );
    }

    relatorio.contar("familias");
    relatorio.contar("vinculos", grupo.ids.length);
    if (grupo.ids.length > 1) relatorio.contar("familias com irmaos");

    if (grupo.ids.length >= FILHOS_SUSPEITO) {
      const semPai = !grupo.nome_pai?.trim();
      relatorio.aviso(
        `familia com ${grupo.ids.length} estudantes${semPai ? " e sem nome do pai" : ""}: ` +
          `mae "${grupo.nome_mae ?? "-"}", pai "${grupo.nome_pai ?? "-"}" -> ` +
          `${grupo.nomes.join("; ")} -- conferir se sao mesmo irmaos`
      );
    }
  }

  return relatorio;
}
