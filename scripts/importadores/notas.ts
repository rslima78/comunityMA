import { IndiceEstudantes, type Executor } from "../../src/lib/casamento";
import {
  normalizarDecimal,
  normalizarNome,
  semAcento,
} from "../../src/lib/normalizar";
import { lerCsv, turmaDoArquivo } from "../lib/csv";
import { Relatorio } from "../lib/relatorio";

/** Rotulo do CSV -> coluna da tabela. Sem lista fixa de disciplinas. */
const CAMPOS: Record<string, string> = {
  "unidade 1": "unidade1",
  "unidade 2": "unidade2",
  "unidade 3": "unidade3",
  "media anual": "media_anual",
  "exame final": "exame_final",
  "media final": "media_final",
};

const ORDEM_CAMPOS = [
  "unidade1",
  "unidade2",
  "unidade3",
  "media_anual",
  "exame_final",
  "media_final",
];

const FIXAS = new Set(["matrícula", "matricula", "nome do estudante", "status"]);

interface Bloco {
  disciplina: string;
  colunas: Map<string, string>; // coluna da tabela -> cabecalho no CSV
}

/**
 * Importa um Notas_-_<TURMA>.csv.
 *
 * As disciplinas sao descobertas lendo o cabecalho: tudo depois das colunas
 * fixas tem o formato "<DISCIPLINA> - <CAMPO>". Nada de lista fixa, porque a
 * grade muda de turma para turma -- a do 6o ano nao tem as mesmas materias
 * do curso tecnico.
 */
export async function importarNotas(
  db: Executor,
  arquivo: string,
  periodo: string
) {
  const relatorio = new Relatorio("Importacao de notas");
  const linhas = lerCsv(arquivo);
  const turma = turmaDoArquivo(arquivo);
  const indice = await IndiceEstudantes.carregar(db);

  relatorio.contar("linhas no arquivo", linhas.length);
  console.log("  turma deduzida do nome do arquivo: " + (turma ?? "(nenhuma)"));

  if (linhas.length === 0) {
    relatorio.pendencia("arquivo sem linhas de estudante");
    return relatorio;
  }

  const cabecalho = Object.keys(linhas[0]);
  const { blocos, ignoradas } = detectarDisciplinas(cabecalho);

  for (const coluna of ignoradas) {
    relatorio.aviso('coluna "' + coluna + '" nao reconhecida -- ignorada');
  }

  if (blocos.length === 0) {
    relatorio.pendencia(
      "nenhuma disciplina detectada no cabecalho: " + cabecalho.join(" | ")
    );
    return relatorio;
  }

  relatorio.contar("disciplinas detectadas", blocos.length);
  console.log("  disciplinas: " + blocos.map((b) => b.disciplina).join(", "));

  for (const [i, linha] of linhas.entries()) {
    const numeroLinha = i + 2;
    const matricula = linha["Matrícula"] ?? linha["Matricula"];
    const nome = linha["Nome do Estudante"];

    const casamento = indice.resolver({ matricula, nome, turma });
    if (!casamento.ok) {
      relatorio.pendencia(
        "linha " + numeroLinha + ': "' + nome + '" (matricula ' +
          (matricula || "-") + ") -> " + casamento.motivo
      );
      continue;
    }

    if (
      casamento.via === "nome" &&
      normalizarNome(nome) !== casamento.estudante.nome_normalizado
    ) {
      relatorio.aviso(
        "linha " + numeroLinha + ': "' + nome + '" casou por nome com "' +
          casamento.estudante.nome + '"'
      );
    }
    relatorio.contar("casados por " + casamento.via);

    for (const bloco of blocos) {
      const valores = ORDEM_CAMPOS.map((campo) => {
        const cabecalhoCsv = bloco.colunas.get(campo);
        return cabecalhoCsv ? normalizarDecimal(linha[cabecalhoCsv]) : null;
      });

      // Disciplina sem nenhuma nota lancada nao vira linha vazia no banco.
      if (valores.every((v) => v === null)) {
        relatorio.contar("disciplinas sem nota");
        continue;
      }

      await db.query(
        `INSERT INTO notas
           (estudante_id, disciplina, unidade1, unidade2, unidade3,
            media_anual, exame_final, media_final, periodo)
         VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9)
         ON CONFLICT (estudante_id, disciplina, periodo) DO UPDATE
           SET unidade1 = EXCLUDED.unidade1,
               unidade2 = EXCLUDED.unidade2,
               unidade3 = EXCLUDED.unidade3,
               media_anual = EXCLUDED.media_anual,
               exame_final = EXCLUDED.exame_final,
               media_final = EXCLUDED.media_final`,
        [casamento.estudante.id, bloco.disciplina, ...valores, periodo]
      );
      relatorio.contar("notas gravadas");
    }

    relatorio.contar("estudantes processados");
  }

  return relatorio;
}

/**
 * Le o cabecalho e monta um bloco por disciplina. Nao assume quantidade nem
 * ordem de campos: se um dia vier so' "Unidade 1" e "Media Final", funciona.
 */
function detectarDisciplinas(cabecalho: string[]) {
  const blocos = new Map<string, Bloco>();
  const ignoradas: string[] = [];

  for (const coluna of cabecalho) {
    if (FIXAS.has(coluna.toLowerCase())) continue;

    const separador = coluna.lastIndexOf(" - ");
    if (separador === -1) {
      ignoradas.push(coluna);
      continue;
    }

    const disciplina = coluna.slice(0, separador).trim();
    const rotulo = semAcento(coluna.slice(separador + 3).trim()).toLowerCase();

    const campo = CAMPOS[rotulo];
    if (!campo || !disciplina) {
      ignoradas.push(coluna);
      continue;
    }

    const bloco = blocos.get(disciplina) ?? { disciplina, colunas: new Map() };
    bloco.colunas.set(campo, coluna);
    blocos.set(disciplina, bloco);
  }

  return { blocos: [...blocos.values()], ignoradas };
}
