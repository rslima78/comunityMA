import type { Executor } from "./casamento";
import { normalizarMatricula, normalizarNome } from "./normalizar";

/**
 * Consultas do painel de avisos.
 *
 * Ficam aqui, e nao dentro das Server Actions, porque recebem a conexao por
 * parametro: assim o mesmo SQL que roda em producao pode ser exercitado
 * contra um Postgres de teste.
 */

export const LIMITE_HISTORICO = 50;
export const LIMITE_RESULTADOS_BUSCA = 20;

export interface TurmaDisponivel {
  turma: string;
  estudantes: number;
}

export interface EstudanteEncontrado {
  id: number;
  nome: string;
  matricula: string;
  turma: string | null;
}

export interface AvisoDoHistorico {
  id: number;
  titulo: string;
  mensagem: string;
  data_envio: Date;
  turma: string | null;
  estudante_nome: string | null;
  estudante_turma: string | null;
  autor: string;
  alcance: number;
}

/**
 * Turmas que existem de fato no cadastro, com quantos estudantes cada uma
 * tem. Nao ha lista fixa de turmas em lugar nenhum: turma nova aparece
 * sozinha assim que o cadastro for importado.
 */
export async function listarTurmas(db: Executor): Promise<TurmaDisponivel[]> {
  const { rows } = await db.query<TurmaDisponivel>(
    `SELECT turma, count(*)::int AS estudantes
     FROM estudantes
     WHERE turma IS NOT NULL AND turma <> ''
     GROUP BY turma
     ORDER BY turma`
  );
  return rows;
}

/**
 * Busca por matricula (comeco) ou por nome (qualquer parte, normalizado).
 *
 * O termo passa pelas normalizacoes antes de entrar no LIKE, o que tambem
 * remove `%` e `_` -- o usuario nao consegue transformar a busca em curinga.
 */
export async function buscarEstudantesPorTermo(
  db: Executor,
  termo: string
): Promise<EstudanteEncontrado[]> {
  const texto = termo.trim();
  if (texto.length < 2) return [];

  const matricula = normalizarMatricula(texto);
  const nome = normalizarNome(texto);
  if (!matricula && !nome) return [];

  const { rows } = await db.query<EstudanteEncontrado>(
    `SELECT id, nome, matricula, turma
     FROM estudantes
     WHERE ($1 <> '' AND matricula LIKE $1 || '%')
        OR ($2 <> '' AND nome_normalizado LIKE '%' || $2 || '%')
     ORDER BY nome
     LIMIT ${LIMITE_RESULTADOS_BUSCA}`,
    [matricula, nome]
  );
  return rows;
}

export async function contarEstudantesDaTurma(
  db: Executor,
  turma: string
): Promise<number> {
  const { rows } = await db.query<{ total: number }>(
    "SELECT count(*)::int AS total FROM estudantes WHERE turma = $1",
    [turma]
  );
  return rows[0]?.total ?? 0;
}

/**
 * Historico, mais recente primeiro.
 *
 * O LEFT JOIN em estudantes e' o que permite mostrar o nome do aluno nos
 * avisos individuais; `alcance` conta quantos estudantes a turma tem hoje,
 * para o cartao dizer o tamanho do envio.
 */
export async function listarAvisos(db: Executor): Promise<AvisoDoHistorico[]> {
  const { rows } = await db.query<AvisoDoHistorico>(
    `SELECT a.id, a.titulo, a.mensagem, a.data_envio, a.turma,
            e.nome  AS estudante_nome,
            e.turma AS estudante_turma,
            ad.usuario AS autor,
            CASE
              WHEN a.turma IS NOT NULL
                THEN (SELECT count(*) FROM estudantes t WHERE t.turma = a.turma)
              ELSE 1
            END::int AS alcance
     FROM avisos a
     JOIN admins ad ON ad.id = a.autor_admin_id
     LEFT JOIN estudantes e ON e.id = a.estudante_id
     ORDER BY a.data_envio DESC, a.id DESC
     LIMIT ${LIMITE_HISTORICO}`
  );
  return rows;
}

export async function registrarAvisoDeTurma(
  db: Executor,
  dados: { titulo: string; mensagem: string; adminId: number; turma: string }
): Promise<number> {
  const { rows } = await db.query<{ id: number }>(
    `INSERT INTO avisos (titulo, mensagem, autor_admin_id, turma)
     VALUES ($1, $2, $3, $4)
     RETURNING id`,
    [dados.titulo, dados.mensagem, dados.adminId, dados.turma]
  );
  return rows[0].id;
}

export async function registrarAvisoDeEstudante(
  db: Executor,
  dados: {
    titulo: string;
    mensagem: string;
    adminId: number;
    estudanteId: number;
  }
): Promise<number> {
  const { rows } = await db.query<{ id: number }>(
    `INSERT INTO avisos (titulo, mensagem, autor_admin_id, estudante_id)
     VALUES ($1, $2, $3, $4)
     RETURNING id`,
    [dados.titulo, dados.mensagem, dados.adminId, dados.estudanteId]
  );
  return rows[0].id;
}
