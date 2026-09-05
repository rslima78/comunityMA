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

  return parse(bruto, {
    columns: (cabecalho: string[]) => cabecalho.map((c) => c.trim()),
    delimiter,
    skip_empty_lines: true,
    relax_column_count: true,
    trim: true,
  });
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
