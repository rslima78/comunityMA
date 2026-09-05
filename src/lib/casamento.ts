import {
  matriculaFrouxa,
  normalizarMatricula,
  normalizarNome,
  normalizarTurma,
} from "./normalizar";

/**
 * Minimo que a importacao precisa de uma conexao. Tanto o Client do pg
 * quanto um Postgres em memoria satisfazem isso, o que deixa os
 * importadores testaveis sem subir servidor.
 */
export interface Executor {
  query<T = Record<string, unknown>>(
    sql: string,
    params?: unknown[]
  ): Promise<{ rows: T[] }>;
}

export interface EstudanteIndexado {
  id: number;
  nome: string;
  nome_normalizado: string;
  matricula: string;
  turma: string | null;
}

export type ViaCasamento = "matricula" | "matricula-frouxa" | "nome";

export type Casamento =
  | { ok: true; estudante: EstudanteIndexado; via: ViaCasamento }
  | { ok: false; motivo: string };

/**
 * Indice em memoria dos estudantes ja cadastrados.
 *
 * A escola tem menos de mil alunos, entao carregar tudo de uma vez sai
 * mais barato que uma consulta por linha importada -- e permite detectar
 * ambiguidade (dois alunos com o mesmo nome) antes de gravar qualquer coisa.
 */
export class IndiceEstudantes {
  private porMatricula = new Map<string, EstudanteIndexado[]>();
  private porMatriculaFrouxa = new Map<string, EstudanteIndexado[]>();
  private porNome = new Map<string, EstudanteIndexado[]>();
  private porNomeETurma = new Map<string, EstudanteIndexado[]>();

  private constructor(public readonly estudantes: EstudanteIndexado[]) {
    for (const e of estudantes) {
      empilhar(this.porMatricula, normalizarMatricula(e.matricula), e);
      empilhar(this.porMatriculaFrouxa, matriculaFrouxa(e.matricula), e);
      empilhar(this.porNome, e.nome_normalizado, e);
      empilhar(
        this.porNomeETurma,
        `${normalizarTurma(e.turma)}|${e.nome_normalizado}`,
        e
      );
    }
  }

  static async carregar(db: Executor) {
    const { rows } = await db.query<EstudanteIndexado>(
      "SELECT id, nome, nome_normalizado, matricula, turma FROM estudantes"
    );
    return new IndiceEstudantes(rows);
  }

  get total() {
    return this.estudantes.length;
  }

  /**
   * Ordem de tentativa, conforme combinado: matricula exata, matricula sem
   * zeros a esquerda e, por ultimo, nome normalizado. Quando ha mais de um
   * candidato o resultado e' ambiguidade -- nunca um chute.
   */
  resolver(alvo: {
    matricula?: unknown;
    nome?: unknown;
    turma?: unknown;
  }): Casamento {
    const turmaNorm = normalizarTurma(alvo.turma);
    const nomeNorm = normalizarNome(alvo.nome);

    const matricula = normalizarMatricula(alvo.matricula);
    if (matricula) {
      const porExata = this.porMatricula.get(matricula) ?? [];
      const escolhida = desempatarPorTurma(porExata, turmaNorm);
      if (escolhida.length === 1) {
        return { ok: true, estudante: escolhida[0], via: "matricula" };
      }
      if (escolhida.length > 1) {
        return {
          ok: false,
          motivo: `matricula ${matricula} corresponde a ${escolhida.length} estudantes`,
        };
      }

      const frouxa = this.porMatriculaFrouxa.get(matriculaFrouxa(matricula)) ?? [];
      const escolhidaFrouxa = desempatarPorTurma(frouxa, turmaNorm);
      if (escolhidaFrouxa.length === 1) {
        return {
          ok: true,
          estudante: escolhidaFrouxa[0],
          via: "matricula-frouxa",
        };
      }
      if (escolhidaFrouxa.length > 1) {
        return {
          ok: false,
          motivo: `matricula ${matricula} (sem zeros a esquerda) corresponde a ${escolhidaFrouxa.length} estudantes`,
        };
      }
    }

    if (nomeNorm) {
      if (turmaNorm) {
        const naTurma = this.porNomeETurma.get(`${turmaNorm}|${nomeNorm}`) ?? [];
        if (naTurma.length === 1) {
          return { ok: true, estudante: naTurma[0], via: "nome" };
        }
        if (naTurma.length > 1) {
          return {
            ok: false,
            motivo: `${naTurma.length} estudantes com o nome "${nomeNorm}" na mesma turma`,
          };
        }
      }

      const porNome = this.porNome.get(nomeNorm) ?? [];
      if (porNome.length === 1) {
        return { ok: true, estudante: porNome[0], via: "nome" };
      }
      if (porNome.length > 1) {
        const turmas = porNome.map((e) => e.turma ?? "sem turma").join(", ");
        return {
          ok: false,
          motivo: `nome "${nomeNorm}" existe em ${porNome.length} cadastros (${turmas})`,
        };
      }
    }

    const identificacao = matricula
      ? `matricula ${matricula}`
      : `nome "${nomeNorm}"`;
    return { ok: false, motivo: `sem correspondencia para ${identificacao}` };
  }
}

function empilhar<T>(mapa: Map<string, T[]>, chave: string, valor: T) {
  if (!chave) return;
  const atual = mapa.get(chave);
  if (atual) atual.push(valor);
  else mapa.set(chave, [valor]);
}

/**
 * Quando varios cadastros compartilham a mesma matricula (o mesmo aluno em
 * duas turmas), a turma do arquivo desempata. Sem turma, devolve todos e o
 * chamador trata como ambiguidade.
 */
function desempatarPorTurma(
  candidatos: EstudanteIndexado[],
  turmaNorm: string
): EstudanteIndexado[] {
  if (candidatos.length <= 1 || !turmaNorm) return candidatos;
  const naTurma = candidatos.filter((e) => normalizarTurma(e.turma) === turmaNorm);
  return naTurma.length > 0 ? naTurma : candidatos;
}
