import { redirect } from "next/navigation";
import { query } from "./db";
import { lerSessao } from "./sessao";

export type EstudanteDaSessao = {
  id: number;
  nome: string;
  matricula: string;
  serie: string | null;
  turma: string | null;
};

export interface SessaoResponsavel {
  estudante: EstudanteDaSessao;
  /** O proprio estudante e os irmaos da mesma familia, em ordem alfabetica. */
  acessiveis: EstudanteDaSessao[];
  precisaTrocarSenha: boolean;
}

/**
 * Monta a sessao do responsavel a partir do cookie.
 *
 * O conjunto de estudantes acessiveis e' recalculado no banco a cada
 * requisicao, a partir do id que veio assinado no cookie. Nunca vem do
 * cliente: assim, mudar a familia de um aluno tem efeito imediato, e nao ha'
 * lista de ids trafegando por onde alguem possa mexer.
 */
export async function carregarSessaoResponsavel(): Promise<SessaoResponsavel | null> {
  const estudanteId = await lerSessao("responsavel");
  if (estudanteId === null) return null;

  const linhas = await query<{
    id: number;
    nome: string;
    matricula: string;
    serie: string | null;
    turma: string | null;
    precisa_trocar_senha: boolean;
  }>(
    `SELECT id, nome, matricula, serie, turma, precisa_trocar_senha
     FROM estudantes WHERE id = $1`,
    [estudanteId]
  );

  const estudante = linhas[0];
  if (!estudante) return null;

  const acessiveis = await query<EstudanteDaSessao>(
    `SELECT e.id, e.nome, e.matricula, e.serie, e.turma
     FROM estudantes e
     WHERE e.id = $1
        OR e.id IN (
          SELECT irmao.estudante_id
          FROM estudante_familia atual
          JOIN estudante_familia irmao ON irmao.familia_id = atual.familia_id
          WHERE atual.estudante_id = $1
        )
     ORDER BY e.nome`,
    [estudanteId]
  );

  return {
    estudante: {
      id: estudante.id,
      nome: estudante.nome,
      matricula: estudante.matricula,
      serie: estudante.serie,
      turma: estudante.turma,
    },
    acessiveis,
    precisaTrocarSenha: estudante.precisa_trocar_senha,
  };
}

/**
 * Guarda das telas do responsavel: exige sessao valida e, enquanto a senha
 * inicial nao for trocada, empurra para a troca antes de liberar qualquer
 * outra pagina.
 */
export async function exigirResponsavel(): Promise<SessaoResponsavel> {
  const sessao = await carregarSessaoResponsavel();
  if (!sessao) redirect("/login");
  if (sessao.precisaTrocarSenha) redirect("/trocar-senha");
  return sessao;
}

export type SessaoAdmin = {
  id: number;
  usuario: string;
};

export async function carregarSessaoAdmin(): Promise<SessaoAdmin | null> {
  const adminId = await lerSessao("admin");
  if (adminId === null) return null;

  const linhas = await query<SessaoAdmin>(
    "SELECT id, usuario FROM admins WHERE id = $1",
    [adminId]
  );
  return linhas[0] ?? null;
}

export async function exigirAdmin(): Promise<SessaoAdmin> {
  const sessao = await carregarSessaoAdmin();
  if (!sessao) redirect("/admin/login");
  return sessao;
}

/**
 * Confere se um estudante pertence a sessao do responsavel.
 *
 * Toda consulta de dado de aluno na Etapa 5 tem que passar por aqui: e' o
 * ponto unico que impede alguem de trocar o id na URL e ver outro estudante.
 */
export function podeVerEstudante(
  sessao: SessaoResponsavel,
  estudanteId: number
): boolean {
  return sessao.acessiveis.some((e) => e.id === estudanteId);
}
