/**
 * Normalizacoes usadas na importacao e no casamento de dados.
 * Tudo aqui e' funcao pura -- da' para testar sem banco.
 */

/** Remove acentos. "JOÃO" -> "JOAO" */
export function semAcento(texto: string) {
  return texto.normalize("NFD").replace(/[\u0300-\u036f]/g, "");
}

/**
 * Nome para comparacao: maiusculo, sem acento, sem pontuacao,
 * espacos colapsados. "  José  D'Ávila " -> "JOSE DAVILA"
 */
export function normalizarNome(valor: unknown): string {
  if (valor == null) return "";
  return semAcento(String(valor))
    .toUpperCase()
    .replace(/[^A-Z0-9 ]/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

/**
 * Matricula como texto de digitos. Serve tanto para a de 12 digitos do
 * SIGEDUC quanto para as curtas de 6 a 8 que convivem na mesma base.
 */
export function normalizarMatricula(valor: unknown): string {
  if (valor == null) return "";
  return String(valor).replace(/\D/g, "");
}

/**
 * Versao "frouxa" da matricula, sem zeros a esquerda. Usada so' como
 * segunda tentativa de casamento, nunca para gravar.
 */
export function matriculaFrouxa(valor: unknown): string {
  return normalizarMatricula(valor).replace(/^0+/, "");
}

/**
 * CPF com 11 digitos. O Excel come zeros a esquerda quando o CPF vira
 * numero, entao 9 digitos viram 11 com o padding.
 */
export function normalizarCpf(valor: unknown): string | null {
  if (valor == null) return null;
  const digitos = String(valor).replace(/\D/g, "");
  if (digitos.length === 0) return null;
  if (digitos.length > 11) return null;
  return digitos.padStart(11, "0");
}

/**
 * Turma para comparacao, ignorando ordinal e pontuacao.
 * "6ºA" e "6A" viram "6A"; "1ºA(INT)" vira "1AINT".
 */
export function normalizarTurma(valor: unknown): string {
  if (valor == null) return "";
  return semAcento(String(valor))
    .toUpperCase()
    .replace(/[^A-Z0-9]/g, "");
}

/**
 * Decimal em portugues. "7,0" -> 7, "" -> null, "-" -> null.
 * Devolve null em vez de 0 para nao inventar nota zero onde nao ha nota.
 */
export function normalizarDecimal(valor: unknown): number | null {
  if (valor == null) return null;
  const texto = String(valor).trim();
  if (texto === "" || texto === "-") return null;
  const numero = Number(texto.replace(/\./g, "").replace(",", "."));
  return Number.isFinite(numero) ? numero : null;
}

/** Inteiro tolerante a vazio. */
export function normalizarInteiro(valor: unknown): number | null {
  if (valor == null) return null;
  const texto = String(valor).trim();
  if (texto === "") return null;
  const numero = Number.parseInt(texto.replace(/\D/g, ""), 10);
  return Number.isFinite(numero) ? numero : null;
}

/**
 * Data DD/MM/AAAA -> Date. Devolve null para vazio ou formato inesperado,
 * em vez de uma data errada.
 */
export function normalizarData(valor: unknown): Date | null {
  if (valor == null) return null;
  if (valor instanceof Date) return valor;
  const texto = String(valor).trim();
  const m = texto.match(/^(\d{2})\/(\d{2})\/(\d{4})$/);
  if (!m) return null;
  const [, dia, mes, ano] = m;
  const data = new Date(Number(ano), Number(mes) - 1, Number(dia));
  return Number.isNaN(data.getTime()) ? null : data;
}

/**
 * Chave de agrupamento familiar: mae e pai normalizados.
 * Devolve null quando nao ha filiacao nenhuma -- sem isso, todos os
 * estudantes sem mae e sem pai cairiam na mesma "familia".
 */
export function chaveFamilia(nomeMae: unknown, nomePai: unknown): string | null {
  const mae = normalizarNome(nomeMae);
  const pai = normalizarNome(nomePai);
  if (!mae && !pai) return null;
  return `${mae}|${pai}`;
}
