"use server";

import { revalidatePath } from "next/cache";
import {
  buscarEstudantesPorTermo,
  contarEstudantesDaTurma,
  registrarAvisoDeEstudante,
  registrarAvisoDeTurma,
  type EstudanteEncontrado,
} from "@/lib/avisos";
import { carregarSessaoAdmin } from "@/lib/auth";
import { bancoPrincipal, query } from "@/lib/db";

export interface EstadoAviso {
  erro?: string;
  sucesso?: string;
  /** id do aviso gravado; o formulario usa para saber que deve se limpar. */
  avisoId?: number;
}

export type { EstudanteEncontrado };

const LIMITE_TITULO = 120;
const LIMITE_MENSAGEM = 2000;

/**
 * Busca estudantes por nome ou matricula, para escolher o destino do aviso.
 *
 * Server Action e' endpoint publico: sem esta checagem de sessao, qualquer
 * pessoa na internet poderia listar os alunos da escola chamando a acao
 * direto, sem passar pela tela.
 */
export async function buscarEstudantes(
  termo: string
): Promise<EstudanteEncontrado[]> {
  if (!(await carregarSessaoAdmin())) return [];
  return buscarEstudantesPorTermo(bancoPrincipal, termo);
}

/**
 * Grava um aviso com destino exclusivo: uma turma inteira OU um estudante.
 *
 * A exclusividade tambem e' garantida por CHECK no banco (migration 001); a
 * validacao aqui existe para devolver uma mensagem util em vez de um erro de
 * constraint.
 */
export async function enviarAviso(
  _anterior: EstadoAviso,
  dados: FormData
): Promise<EstadoAviso> {
  const admin = await carregarSessaoAdmin();
  if (!admin) {
    return { erro: "Sessao expirada. Entre de novo para enviar o aviso." };
  }

  const titulo = String(dados.get("titulo") ?? "").trim();
  const mensagem = String(dados.get("mensagem") ?? "").trim();
  const tipoDestino = String(dados.get("tipo_destino") ?? "");

  if (!titulo) return { erro: "Escreva um titulo para o aviso." };
  if (titulo.length > LIMITE_TITULO) {
    return { erro: `O titulo pode ter no maximo ${LIMITE_TITULO} caracteres.` };
  }
  if (!mensagem) return { erro: "Escreva a mensagem do aviso." };
  if (mensagem.length > LIMITE_MENSAGEM) {
    return {
      erro: `A mensagem pode ter no maximo ${LIMITE_MENSAGEM} caracteres.`,
    };
  }

  if (tipoDestino === "turma") {
    const turma = String(dados.get("turma") ?? "").trim();
    if (!turma) return { erro: "Escolha a turma que vai receber o aviso." };

    // Confere contra as turmas que existem de fato: um valor forjado no
    // formulario criaria um aviso que nunca chega a ninguem.
    const alcance = await contarEstudantesDaTurma(bancoPrincipal, turma);
    if (alcance === 0) return { erro: "Essa turma nao existe no cadastro." };

    const avisoId = await registrarAvisoDeTurma(bancoPrincipal, {
      titulo,
      mensagem,
      adminId: admin.id,
      turma,
    });

    revalidatePath("/admin");
    return {
      sucesso: `Aviso enviado para a turma ${turma} (${alcance} estudantes).`,
      avisoId,
    };
  }

  if (tipoDestino === "estudante") {
    const estudanteId = Number(dados.get("estudante_id"));
    if (!Number.isInteger(estudanteId) || estudanteId <= 0) {
      return { erro: "Escolha o estudante que vai receber o aviso." };
    }

    const alvo = await query<{ nome: string }>(
      "SELECT nome FROM estudantes WHERE id = $1",
      [estudanteId]
    );
    if (!alvo[0]) return { erro: "Estudante nao encontrado." };

    const avisoId = await registrarAvisoDeEstudante(bancoPrincipal, {
      titulo,
      mensagem,
      adminId: admin.id,
      estudanteId,
    });

    revalidatePath("/admin");
    return { sucesso: `Aviso enviado para ${alvo[0].nome}.`, avisoId };
  }

  return { erro: "Escolha se o aviso vai para uma turma ou para um estudante." };
}
