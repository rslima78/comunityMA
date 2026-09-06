"use server";

import { redirect } from "next/navigation";
import { query } from "@/lib/db";
import { carregarSessaoResponsavel } from "@/lib/auth";
import { conferirSenha, gerarHash, validarNovaSenha } from "@/lib/senha";

export interface EstadoTroca {
  erro?: string;
}

/**
 * Troca a senha do estudante que esta' na sessao -- e so' dele.
 *
 * O id vem do cookie assinado, nunca do formulario: nao existe campo que
 * permita apontar a troca para outro aluno.
 */
export async function trocarSenha(
  _anterior: EstadoTroca,
  dados: FormData
): Promise<EstadoTroca> {
  const sessao = await carregarSessaoResponsavel();
  if (!sessao) redirect("/login");

  const senhaAtual = String(dados.get("senha_atual") ?? "");
  const nova = String(dados.get("nova_senha") ?? "");
  const confirmacao = String(dados.get("confirmacao") ?? "");

  const linhas = await query<{ senha_hash: string | null }>(
    "SELECT senha_hash FROM estudantes WHERE id = $1",
    [sessao.estudante.id]
  );

  if (!(await conferirSenha(senhaAtual, linhas[0]?.senha_hash ?? null))) {
    return { erro: "A senha atual esta incorreta." };
  }

  if (nova !== confirmacao) {
    return { erro: "A confirmacao nao confere com a nova senha." };
  }

  const problema = validarNovaSenha(nova, senhaAtual);
  if (problema) return { erro: problema };

  await query(
    `UPDATE estudantes
     SET senha_hash = $1, precisa_trocar_senha = FALSE, senha_alterada_em = now()
     WHERE id = $2`,
    [await gerarHash(nova), sessao.estudante.id]
  );

  redirect("/portal");
}
