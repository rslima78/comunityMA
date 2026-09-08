import {
  IndiceEstudantes,
  type Executor,
  type EstudanteIndexado,
} from "../../src/lib/casamento";
import {
  normalizarInteiro,
  normalizarNome,
  normalizarTurma,
} from "../../src/lib/normalizar";
import { lerCsv, turmaDoArquivo } from "../lib/csv";
import { gravarLinha, motivoCurto } from "../lib/linha";
import { Relatorio } from "../lib/relatorio";

/** Cabecalhos aceitos, na ordem de preferencia. */
const COLUNAS = {
  nome: ["ALUNO", "NOME", "Nome", "ESTUDANTE"],
  matricula: ["MATRÍCULA", "MATRICULA"],
  aulas: ["AULAS", "Total de Aulas", "TOTAL DE AULAS"],
  faltas: ["FALTAS", "Total de Faltas", "TOTAL DE FALTAS"],
};

function coluna(linha: Record<string, string>, nomes: string[]) {
  for (const nome of nomes) {
    const valor = linha[nome];
    if (valor !== undefined && valor !== null && String(valor).trim() !== "") {
      return String(valor);
    }
  }
  return undefined;
}

/**
 * Importa faltas.
 *
 * Aceita dois formatos: o relatorio unico da escola exportado do SIGEDUC
 * (ALUNO;MATRICULA;AULAS;FALTAS) e o arquivo por turma gerado pela escola
 * (NOME;Total de Faltas). No segundo nao ha matricula nem total de aulas --
 * o casamento e' por nome, restrito a turma que vem do nome do arquivo, e o
 * percentual e' calculado na tela a partir dos dias letivos.
 *
 * Nome que nao casar vira pendencia com sugestoes de quem parece ser, para o
 * administrador decidir -- nunca um chute.
 */
export async function importarFrequencia(
  db: Executor,
  arquivo: string,
  periodo: string
) {
  const relatorio = new Relatorio("Importacao de frequencia");
  const linhas = lerCsv(arquivo);
  const turma = turmaDoArquivo(arquivo);
  const indice = await IndiceEstudantes.carregar(db);

  relatorio.contar("linhas no arquivo", linhas.length);
  relatorio.contar("estudantes cadastrados", indice.total);

  if (turma) {
    console.log(`  turma deduzida do nome do arquivo: ${turma}`);
    relatorio.aviso(`turma deduzida do nome do arquivo: ${turma}`);
  }

  if (indice.total === 0) {
    relatorio.pendencia(
      "nenhum estudante cadastrado -- importe o cadastro antes das faltas"
    );
    return relatorio;
  }

  // O arquivo pode trazer o mesmo aluno mais de uma vez. Sem isso, a ultima
  // linha sobrescreveria as anteriores sem ninguem ficar sabendo.
  const jaVistos = new Map<
    number,
    { linha: number; aulas: number | null; faltas: number | null }
  >();

  for (const [i, linha] of linhas.entries()) {
    const numeroLinha = i + 2;
    const aluno = coluna(linha, COLUNAS.nome);
    const matricula = coluna(linha, COLUNAS.matricula);

    if (!aluno && !matricula) {
      relatorio.pendencia(
        `linha ${numeroLinha}: sem nome e sem matricula. ` +
          `O arquivo precisa ter uma coluna ${COLUNAS.nome.join(" ou ")}. ` +
          `Cabecalho encontrado: ${Object.keys(linha).join(" | ")}`
      );
      continue;
    }

    const casamento = indice.resolver({ matricula, nome: aluno, turma });

    if (!casamento.ok) {
      const sugestoes = parecidos(indice, aluno, turma);
      relatorio.pendencia(
        `linha ${numeroLinha}: "${aluno}"` +
          (turma ? ` da turma ${turma}` : "") +
          ` nao foi encontrado no cadastro -- ${casamento.motivo}.` +
          (sugestoes.length > 0
            ? ` Seria algum destes? ${sugestoes.join("; ")}`
            : " Nenhum nome parecido na turma.") +
          " Confira a grafia na planilha ou no cadastro e importe de novo."
      );
      continue;
    }

    relatorio.contar(`casados por ${casamento.via}`);

    const aulas = normalizarInteiro(coluna(linha, COLUNAS.aulas));
    const faltas = normalizarInteiro(coluna(linha, COLUNAS.faltas));

    if (faltas === null) {
      relatorio.pendencia(
        `linha ${numeroLinha}: "${aluno}" sem numero de faltas. ` +
          `O arquivo precisa ter uma coluna ${COLUNAS.faltas.join(" ou ")}.`
      );
      continue;
    }

    const anterior = jaVistos.get(casamento.estudante.id);

    if (anterior) {
      if (anterior.aulas === aulas && anterior.faltas === faltas) {
        relatorio.contar("linhas repetidas identicas");
        continue;
      }

      // O relatorio do SIGEDUC traz um bloco final de linhas zeradas para
      // alunos que ja apareceram com os numeros reais. Zero nao e'
      // informacao, e' preenchimento -- entao vence a linha com dados, e nao
      // a primeira que aparecer, que so' funcionaria pela ordem do arquivo.
      const vazia = (l: { aulas: number | null; faltas: number | null }) =>
        (l.aulas === null || l.aulas === 0) &&
        (l.faltas === null || l.faltas === 0);
      const novaEhVazia = vazia({ aulas, faltas });
      const anteriorEhVazia = vazia(anterior);

      if (novaEhVazia && !anteriorEhVazia) {
        relatorio.contar("linhas zeradas descartadas");
        continue;
      }

      if (!novaEhVazia && !anteriorEhVazia) {
        relatorio.pendencia(
          `linha ${numeroLinha}: "${aluno}" ja aparecia na linha ${anterior.linha} ` +
            `com ${anterior.faltas} faltas e agora com ${faltas} -- ` +
            `valores conflitantes, mantido o maior`
        );
        if ((anterior.faltas ?? 0) >= faltas) continue;
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

/**
 * Nomes da mesma turma parecidos com o que veio na planilha.
 *
 * A comparacao e' por palavra, tolerando pequenas diferencas de grafia:
 * "AGATA LAYS SOUZA" e "AGATHA LAIS SOUSA" sao a mesma pessoa escrita de dois
 * jeitos, e trocas assim (S/Z, I/Y, H mudo) sao a regra em cadastro escolar,
 * nao a excecao. Exigir grafia identica faria a sugestao falhar justamente
 * nos casos em que ela e' mais util.
 */
function parecidos(
  indice: IndiceEstudantes,
  nome: string | undefined,
  turma: string | null
): string[] {
  if (!nome) return [];

  const palavras = normalizarNome(nome)
    .split(" ")
    .filter((p) => p.length > 2);
  if (palavras.length === 0) return [];

  const naTurma = (e: EstudanteIndexado) =>
    !turma || normalizarTurma(e.turma) === normalizarTurma(turma);

  return indice.estudantes
    .filter(naTurma)
    .map((e) => ({
      nome: e.nome,
      pontos: e.nome_normalizado
        .split(" ")
        .filter((p) => p.length > 2)
        .filter((p) => palavras.some((q) => pareceMesmaPalavra(p, q))).length,
    }))
    .filter((c) => c.pontos >= 2)
    .sort((a, b) => b.pontos - a.pontos)
    .slice(0, 3)
    .map((c) => c.nome);
}

/** Igual, ou a uma edicao de distancia (duas para palavras longas). */
function pareceMesmaPalavra(a: string, b: string): boolean {
  if (a === b) return true;
  if (Math.abs(a.length - b.length) > 2) return false;
  const tolerancia = Math.min(a.length, b.length) >= 7 ? 2 : 1;
  return distancia(a, b, tolerancia) <= tolerancia;
}

/** Levenshtein com corte: para de contar assim que passa do limite. */
function distancia(a: string, b: string, limite: number): number {
  let anterior = Array.from({ length: b.length + 1 }, (_, i) => i);

  for (let i = 1; i <= a.length; i++) {
    const atual = [i];
    let menor = i;

    for (let j = 1; j <= b.length; j++) {
      const custo = a[i - 1] === b[j - 1] ? 0 : 1;
      atual[j] = Math.min(
        anterior[j] + 1,
        atual[j - 1] + 1,
        anterior[j - 1] + custo
      );
      menor = Math.min(menor, atual[j]);
    }

    if (menor > limite) return limite + 1;
    anterior = atual;
  }

  return anterior[b.length];
}
