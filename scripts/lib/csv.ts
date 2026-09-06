import { readFileSync } from "node:fs";
import { basename } from "node:path";
import { parse } from "csv-parse/sync";

/**
 * Le um CSV da escola.
 *
 * Os arquivos vem com BOM UTF-8 e o separador varia entre exportacoes: notas
 * e frequencia usam ";", ocorrencias usa ",". Em vez de exigir que o nome do
 * arquivo diga qual e', o separador e' detectado pela linha de cabecalho.
 */
export function lerCsv(arquivo: string): Record<string, string>[] {
  const bruto = readFileSync(arquivo, "utf8").replace(/^\uFEFF/, "");
  const cabecalho = bruto.split(/\r?\n/, 1)[0] ?? "";

  const pontoEVirgula = (cabecalho.match(/;/g) ?? []).length;
  const virgula = (cabecalho.match(/,/g) ?? []).length;
  const delimiter = pontoEVirgula >= virgula ? ";" : ",";

  try {
    return parse(bruto, {
      columns: (cabecalho: string[]) => cabecalho.map((c) => c.trim()),
      delimiter,
      skip_empty_lines: true,
      relax_column_count: true,
      trim: true,
    });
  } catch (erro) {
    // Acontece quando o arquivo nao e' CSV de verdade -- um .xlsx renomeado,
    // por exemplo. Sem isto o usuario recebe uma pilha de erro do parser.
    const motivo = primeiraLinha((erro as Error)?.message ?? String(erro));
    throw new ArquivoIlegivel(
      `Nao foi possivel ler "${basename(arquivo)}" como CSV. ` +
        `Confira se o arquivo e' mesmo um CSV exportado do SIGEDUC. (${motivo})`,
      { cause: erro }
    );
  }
}

/** Primeira linha de uma mensagem de erro, sem a pilha. */
function primeiraLinha(texto: string): string {
  const quebra = texto.search(/[\r\n]/);
  return quebra === -1 ? texto : texto.slice(0, quebra);
}

/** Arquivo que nao da' para interpretar -- diferente de linha com problema. */
export class ArquivoIlegivel extends Error {
  constructor(mensagem: string, opcoes?: { cause?: unknown }) {
    super(mensagem, opcoes);
    this.name = "ArquivoIlegivel";
  }
}

/**
 * Extrai a turma do nome do arquivo, que e' onde ela esta' -- nem o CSV de
 * notas nem o de ocorrencias trazem coluna de turma.
 *
 *   "Notas - 6ºA.csv"        -> "6ºA"
 *   "Notas_-_6ºA.csv"        -> "6ºA"
 *   "Ocorrencias 6A.csv"     -> "6A"
 *   "Ocorrencias_EVI - TURMA C.csv" -> "EVI - TURMA C"
 */
export function turmaDoArquivo(arquivo: string): string | null {
  const nome = basename(arquivo).replace(/\.[^.]+$/, "");
  const semPrefixo = nome
    .replace(/^(notas|ocorr[eê]ncias?)/i, "")
    .replace(/^[\s_-]+/, "")
    .trim();
  return semPrefixo === "" ? null : semPrefixo;
}
