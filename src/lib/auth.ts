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
  /** true enquanto a senha for a inicial (data de nascimento). */
  usandoSenhaInicial: boolean;
}

/**
 * Monta a sessao do responsavel a partir do cookie.
 *
 * Um login da acesso a exatamente um estudante: o id vem assinado no cookie e
 * o registro e' relido do banco a cada requisicao. Nao existe lista de
 * estudantes acessiveis, nem irmaos -- responsavel com mais de um filho entra
 * com o CPF de cada um, separadamente.
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

  return {
    estudante: {
      id: estudante.id,
      nome: estudante.nome,
      matricula: estudante.matricula,
      serie: estudante.serie,
      turma: estudante.turma,
    },
    usandoSenhaInicial: estudante.precisa_trocar_senha,
  };
}

/**
 * Guarda das telas do responsavel: exige sessao valida.
 *
 * A troca de senha e' opcional. Quem ainda usa a senha inicial entra
 * normalmente e ve um convite para trocar no portal -- prender a familia numa
 * tela de senha antes de deixar ver as notas afastaria justamente quem menos
 * tem intimidade com o sistema.
 */
export async function exigirResponsavel(): Promise<SessaoResponsavel> {
  const sessao = await carregarSessaoResponsavel();
  if (!sessao) redirect("/login");
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
 * Ponto unico de checagem para as consultas da Etapa 5.
 *
 * Parece trivial hoje -- a sessao tem um estudante so' --, mas toda consulta
 * de nota, falta, ocorrencia ou aviso deve passar por aqui em vez de confiar
 * num id vindo da URL. Se um dia a regra de acesso mudar, muda num lugar so'.
 */
export function podeVerEstudante(
  sessao: SessaoResponsavel,
  estudanteId: number
): boolean {
  return sessao.estudante.id === estudanteId;
}
