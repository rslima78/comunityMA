import type { Executor } from "./casamento";

/**
 * Consultas da tela do responsavel. Todas recebem a conexao por parametro,
 * para poderem ser exercitadas contra um Postgres de teste, e todas filtram
 * por estudante_id -- o id vem da sessao assinada, nunca da URL.
 */

/** Nota minima de aprovacao por unidade. */
export const MEDIA_APROVACAO = 5;

/**
 * Frequencia igual ou inferior a esta reprova o estudante direto por faltas,
 * independentemente das notas. E' a regra da Secretaria de Educacao.
 *
 * A tela fala em frequencia, e nao em percentual de faltas, porque e' esse o
 * numero que a escola usa e que a familia ouve na reuniao.
 */
export const FREQUENCIA_REPROVACAO_DIRETA = 25;

/** true quando a frequencia ja' reprova o estudante por falta. */
export function reprovadoPorFaltas(presenca: number | null): boolean {
  return presenca !== null && presenca <= FREQUENCIA_REPROVACAO_DIRETA;
}

/**
 * O sistema da escola nao informa o total de aulas dadas, so' o total de
 * faltas -- e uma falta e' de uma aula, nao de um dia. Estes dois numeros
 * convertem uma coisa na outra:
 *
 *   dias faltados = faltas / AULAS_POR_DIA
 *   percentual    = dias faltados / DIAS_LETIVOS
 *
 * Sao a base combinada com a escola. Quando o arquivo importado trouxer o
 * total de aulas de verdade (o relatorio do SIGEDUC traz), ele tem
 * preferencia e estes numeros nao sao usados.
 */
export const AULAS_POR_DIA = 5;
export const DIAS_LETIVOS = 70;

export interface AvisoDoEstudante {
  id: number;
  titulo: string;
  mensagem: string;
  data_envio: Date;
  /** null quando o aviso e' individual */
  turma: string | null;
}

export interface NotaDaDisciplina {
  disciplina: string;
  unidade1: string | null;
  unidade2: string | null;
  unidade3: string | null;
  media_anual: string | null;
  exame_final: string | null;
  media_final: string | null;
  periodo: string;
}

export interface FrequenciaDoEstudante {
  total_aulas: number | null;
  total_faltas: number | null;
  periodo: string;
}

export interface OcorrenciaDoEstudante {
  id: number;
  tipo: string;
  descricao: string | null;
  data: Date | null;
}

/**
 * Avisos individuais do estudante mais os da turma dele, misturados por data.
 *
 * A turma e' lida na hora, do proprio cadastro: se o aluno mudar de turma,
 * ele passa a ver os avisos da turma nova sem precisar mexer em nada.
 */
export async function avisosDoEstudante(
  db: Executor,
  estudanteId: number
): Promise<AvisoDoEstudante[]> {
  const { rows } = await db.query<AvisoDoEstudante>(
    `SELECT a.id, a.titulo, a.mensagem, a.data_envio, a.turma
     FROM avisos a
     WHERE a.estudante_id = $1
        OR a.turma = (SELECT turma FROM estudantes WHERE id = $1)
     ORDER BY a.data_envio DESC, a.id DESC`,
    [estudanteId]
  );
  return rows;
}

export async function notasDoEstudante(
  db: Executor,
  estudanteId: number
): Promise<NotaDaDisciplina[]> {
  const { rows } = await db.query<NotaDaDisciplina>(
    `SELECT disciplina, unidade1, unidade2, unidade3,
            media_anual, exame_final, media_final, periodo
     FROM notas
     WHERE estudante_id = $1
     ORDER BY periodo DESC, disciplina`,
    [estudanteId]
  );
  return rows;
}

export async function frequenciaDoEstudante(
  db: Executor,
  estudanteId: number
): Promise<FrequenciaDoEstudante | null> {
  const { rows } = await db.query<FrequenciaDoEstudante>(
    `SELECT total_aulas, total_faltas, periodo
     FROM frequencia
     WHERE estudante_id = $1
     ORDER BY periodo DESC
     LIMIT 1`,
    [estudanteId]
  );
  return rows[0] ?? null;
}

export async function ocorrenciasDoEstudante(
  db: Executor,
  estudanteId: number
): Promise<OcorrenciaDoEstudante[]> {
  const { rows } = await db.query<OcorrenciaDoEstudante>(
    `SELECT id, tipo, descricao, data
     FROM ocorrencias
     WHERE estudante_id = $1
     ORDER BY data DESC NULLS LAST, id DESC`,
    [estudanteId]
  );
  return rows;
}

/** NUMERIC volta como texto do Postgres; aqui vira numero ou null. */
export function comoNumero(valor: string | null): number | null {
  if (valor === null || valor === "") return null;
  const numero = Number(valor);
  return Number.isFinite(numero) ? numero : null;
}

/**
 * Diz se um fechamento (media anual, exame ou media final) foi mesmo lancado.
 *
 * O SIGEDUC exporta 0,0 nesses tres campos enquanto o ano nao fecha, e nao
 * vazio. Mostrar isso como nota faria toda familia ver zero em vermelho em
 * todas as disciplinas, em pleno meio do ano.
 *
 * A regra: zero so' e' tratado como "nao lancada" quando contradiz as
 * unidades. Se o aluno tem 5 e 7 nas unidades, uma media anual 0 nao foi
 * calculada. Se as unidades dele tambem sao 0, o zero e' real e aparece --
 * o aluno que esta' de fato zerado nao fica escondido do responsavel.
 */
export function fechamentoLancado(
  valor: number | null,
  unidades: (number | null)[]
): boolean {
  if (valor === null) return false;
  if (valor > 0) return true;

  const lancadas = unidades.filter((u): u is number => u !== null);
  if (lancadas.length === 0) return false;
  return lancadas.every((u) => u === 0);
}

export interface DisciplinaFormatada {
  disciplina: string;
  unidades: { rotulo: string; valor: number | null }[];
  mediaAnual: number | null;
  exameFinal: number | null;
  mediaFinal: number | null;
  /** true quando alguma nota lancada ficou abaixo da media de aprovacao */
  atencao: boolean;
}

export function formatarDisciplina(nota: NotaDaDisciplina): DisciplinaFormatada {
  const u1 = comoNumero(nota.unidade1);
  const u2 = comoNumero(nota.unidade2);
  const u3 = comoNumero(nota.unidade3);
  const unidades = [u1, u2, u3];

  const filtrar = (valor: string | null) => {
    const numero = comoNumero(valor);
    return fechamentoLancado(numero, unidades) ? numero : null;
  };

  const mediaAnual = filtrar(nota.media_anual);
  const exameFinal = filtrar(nota.exame_final);
  const mediaFinal = filtrar(nota.media_final);

  const abaixo = [...unidades, mediaAnual, mediaFinal].some(
    (v) => v !== null && v < MEDIA_APROVACAO
  );

  return {
    disciplina: nota.disciplina,
    unidades: [
      { rotulo: "1ª un.", valor: u1 },
      { rotulo: "2ª un.", valor: u2 },
      { rotulo: "3ª un.", valor: u3 },
    ],
    mediaAnual,
    exameFinal,
    mediaFinal,
    atencao: abaixo,
  };
}

/** Dias de aula perdidos, a partir do total de faltas. */
export function diasFaltados(
  frequencia: FrequenciaDoEstudante | null
): number | null {
  const faltas = frequencia?.total_faltas;
  if (faltas === null || faltas === undefined) return null;
  return faltas / AULAS_POR_DIA;
}

/**
 * Percentual de faltas.
 *
 * Usa o total de aulas quando ele existe no registro; senao, cai para os dias
 * letivos combinados. Devolve null so' quando nao ha' faltas registradas.
 */
export function percentualDeFaltas(
  frequencia: FrequenciaDoEstudante | null
): number | null {
  if (!frequencia) return null;
  const { total_aulas: aulas, total_faltas: faltas } = frequencia;
  if (faltas === null) return null;

  if (aulas !== null && aulas > 0) return (faltas / aulas) * 100;

  const dias = faltas / AULAS_POR_DIA;
  return (dias / DIAS_LETIVOS) * 100;
}

/**
 * Percentual de presenca. E' o complemento das faltas, limitado a 0-100 para
 * o caso de um total de faltas maior que o esperado nao virar numero negativo
 * na tela.
 */
export function percentualDeFrequencia(
  frequencia: FrequenciaDoEstudante | null
): number | null {
  const faltas = percentualDeFaltas(frequencia);
  if (faltas === null) return null;
  return Math.min(100, Math.max(0, 100 - faltas));
}

/** "47" ou "4,6" -- inteiro quando exato, uma casa quando nao. */
export function formatarDias(dias: number): string {
  return Number.isInteger(dias)
    ? String(dias)
    : dias.toFixed(1).replace(".", ",");
}

/** Nota com virgula e uma casa, ou travessao quando nao lancada. */
export function formatarNota(valor: number | null): string {
  return valor === null ? "—" : valor.toFixed(1).replace(".", ",");
}
