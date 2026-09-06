import { IndiceEstudantes, type Executor } from "../../src/lib/casamento";
import { normalizarData } from "../../src/lib/normalizar";
import { lerCsv, turmaDoArquivo } from "../lib/csv";
import { gravarLinha, motivoCurto } from "../lib/linha";
import { Relatorio } from "../lib/relatorio";

/**
 * Importa um Ocorrencias_<TURMA>.csv.
 *
 * Este arquivo so' traz o nome do estudante, sem matricula -- o casamento e'
 * necessariamente por nome. A turma vem do nome do arquivo e serve para
 * restringir a busca, o que resolve a maior parte dos homonimos da escola.
 *
 * Como nao existe identificador da ocorrencia na origem, a repeticao e'
 * evitada comparando tipo, descricao e data: reimportar o mesmo arquivo nao
 * duplica os registros.
 */
export async function importarOcorrencias(db: Executor, arquivo: string) {
  const relatorio = new Relatorio("Importacao de ocorrencias");
  const linhas = lerCsv(arquivo);
  const turma = turmaDoArquivo(arquivo);
  const indice = await IndiceEstudantes.carregar(db);

  relatorio.contar("linhas no arquivo", linhas.length);
  console.log("  turma deduzida do nome do arquivo: " + (turma ?? "(nenhuma)"));

  for (const [i, linha] of linhas.entries()) {
    const numeroLinha = i + 2;
    const nome = linha["Estudante"];
    const tipo = linha["Tipo de Ocorrência"] ?? linha["Tipo de Ocorrencia"];
    const descricao = linha["Descrição"] ?? linha["Descricao"] ?? null;
    const dataBruta = linha["Data"];
    const data = normalizarData(dataBruta);

    if (!nome) {
      relatorio.aviso("linha " + numeroLinha + ": sem nome do estudante -- ignorada");
      continue;
    }
    if (!tipo) {
      relatorio.pendencia(
        "linha " + numeroLinha + ': "' + nome + '" sem tipo de ocorrencia'
      );
      continue;
    }
    if (dataBruta && data === null) {
      relatorio.aviso(
        "linha " + numeroLinha + ': "' + nome + '" com data em formato inesperado ("' +
          dataBruta + '") -- gravada sem data'
      );
    }

    const casamento = indice.resolver({ nome, turma });
    if (!casamento.ok) {
      relatorio.pendencia(
        "linha " + numeroLinha + ': "' + nome + '" -> ' + casamento.motivo
      );
      continue;
    }

    // IS NOT DISTINCT FROM trata NULL como valor comparavel: sem isso, uma
    // ocorrencia sem data seria reinserida a cada importacao.
    const jaExiste = await db.query<{ id: number }>(
      `SELECT id FROM ocorrencias
       WHERE estudante_id = $1 AND tipo = $2
         AND descricao IS NOT DISTINCT FROM $3
         AND data IS NOT DISTINCT FROM $4`,
      [casamento.estudante.id, tipo, descricao, data]
    );

    if (jaExiste.rows.length > 0) {
      relatorio.contar("ja existiam");
      continue;
    }

    const falha = await gravarLinha(db, () =>
      db
        .query(
          `INSERT INTO ocorrencias (estudante_id, tipo, descricao, data)
           VALUES ($1, $2, $3, $4)`,
          [casamento.estudante.id, tipo, descricao, data]
        )
        .then(() => undefined)
    );

    if (falha) {
      relatorio.pendencia(
        `linha ${numeroLinha}: "${nome}" nao pode ser gravada -- ${motivoCurto(falha)}`
      );
      continue;
    }
    relatorio.contar("gravadas");
  }

  return relatorio;
}
