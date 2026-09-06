import { IndiceEstudantes, type Executor } from "../../src/lib/casamento";
import { normalizarInteiro } from "../../src/lib/normalizar";
import { lerCsv } from "../lib/csv";
import { gravarLinha, motivoCurto } from "../lib/linha";
import { Relatorio } from "../lib/relatorio";

/**
 * Importa relatorio_frequencia_aluno.csv (escola inteira, totais acumulados).
 *
 * E' o arquivo com o pior casamento: a matricula nem sempre segue o padrao do
 * cadastro. A ordem de tentativa e' matricula exata, matricula sem zeros a
 * esquerda e nome normalizado; o que nao resolver entra no relatorio, com o
 * total impresso no fim.
 */
export async function importarFrequencia(
  db: Executor,
  arquivo: string,
  periodo: string
) {
  const relatorio = new Relatorio("Importacao de frequencia");
  const linhas = lerCsv(arquivo);
  const indice = await IndiceEstudantes.carregar(db);

  relatorio.contar("linhas no arquivo", linhas.length);
  relatorio.contar("estudantes cadastrados", indice.total);

  // O arquivo pode trazer o mesmo aluno mais de uma vez. Sem isso, a ultima
  // linha sobrescreveria as anteriores sem ninguem ficar sabendo.
  const jaVistos = new Map<
    number,
    { linha: number; aulas: number | null; faltas: number | null }
  >();

  if (indice.total === 0) {
    relatorio.pendencia(
      "nenhum estudante cadastrado -- importe estudantes.xlsx antes da frequencia"
    );
    return relatorio;
  }

  for (const [i, linha] of linhas.entries()) {
    const numeroLinha = i + 2;
    const aluno = linha["ALUNO"];
    const matricula = linha["MATRÍCULA"] ?? linha["MATRICULA"];

    if (!aluno && !matricula) {
      relatorio.aviso(`linha ${numeroLinha}: sem aluno e sem matricula -- ignorada`);
      continue;
    }

    const casamento = indice.resolver({ matricula, nome: aluno });

    if (!casamento.ok) {
      relatorio.pendencia(
        `linha ${numeroLinha}: "${aluno}" (matricula ${matricula || "-"}) -> ${casamento.motivo}`
      );
      continue;
    }

    relatorio.contar(`casados por ${casamento.via}`);

    const aulas = normalizarInteiro(linha["AULAS"]);
    const faltas = normalizarInteiro(linha["FALTAS"]);
    const anterior = jaVistos.get(casamento.estudante.id);

    if (anterior) {
      if (anterior.aulas === aulas && anterior.faltas === faltas) {
        relatorio.contar("linhas repetidas identicas");
        continue;
      }

      // O arquivo traz um bloco final de linhas zeradas para alunos que ja
      // apareceram com os numeros reais. Zero aula nao e' informacao, e'
      // preenchimento -- entao vence sempre a linha com mais aulas, e nao a
      // primeira que aparecer, que so' funcionaria pela ordem atual do arquivo.
      const vazia = (n: number | null) => n === null || n === 0;
      const novaEhVazia = vazia(aulas);
      const anteriorEhVazia = vazia(anterior.aulas);

      if (novaEhVazia && !anteriorEhVazia) {
        relatorio.contar("linhas zeradas descartadas");
        continue;
      }

      if (!novaEhVazia && !anteriorEhVazia) {
        relatorio.pendencia(
          `linha ${numeroLinha}: "${aluno}" ja aparecia na linha ${anterior.linha} ` +
            `com ${anterior.aulas}/${anterior.faltas} aulas/faltas e agora com ` +
            `${aulas}/${faltas} -- valores conflitantes, mantido o maior`
        );
        if ((anterior.aulas ?? 0) >= (aulas ?? 0)) continue;
      } else {
        relatorio.contar("linhas zeradas substituidas");
      }
    }

    jaVistos.set(casamento.estudante.id, { linha: numeroLinha, aulas, faltas });

    const falha = await gravarLinha(db, () =>
      db
        .query(
          `INSERT INTO frequencia (estudante_id, total_aulas, total_faltas, periodo)
           VALUES ($1, $2, $3, $4)
           ON CONFLICT (estudante_id, periodo) DO UPDATE
             SET total_aulas = EXCLUDED.total_aulas,
                 total_faltas = EXCLUDED.total_faltas`,
          [casamento.estudante.id, aulas, faltas, periodo]
        )
        .then(() => undefined)
    );

    if (falha) {
      relatorio.pendencia(
        `linha ${numeroLinha}: "${aluno}" nao pode ser gravada -- ${motivoCurto(falha)}`
      );
      continue;
    }
    relatorio.contar("gravados");
  }

  return relatorio;
}
