"use server";

import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { query } from "@/lib/db";
import { registrarTentativa, limparTentativas } from "@/lib/limite";
import { normalizarCpf } from "@/lib/normalizar";
import { conferirSenha, gastarTempoDeSenha } from "@/lib/senha";
import { abrirSessao, fecharSessao } from "@/lib/sessao";

export interface EstadoLogin {
  erro?: string;
}

/**
 * Mensagem unica para CPF inexistente, senha errada e cadastro sem senha.
 * Distinguir os casos entregaria de graca a lista de quem estuda na escola.
 */
const CREDENCIAL_INVALIDA = "CPF ou senha invalidos.";

async function origem(): Promise<string> {
  const cabecalhos = await headers();
  return (
    cabecalhos.get("x-forwarded-for")?.split(",")[0]?.trim() ??
    cabecalhos.get("x-real-ip") ??
    "desconhecido"
  );
}

export async function entrar(
  _anterior: EstadoLogin,
  dados: FormData
): Promise<EstadoLogin> {
  const cpf = normalizarCpf(dados.get("cpf"));
  const senha = String(dados.get("senha") ?? "");

  const limite = registrarTentativa(`login:${await origem()}:${cpf ?? "-"}`);
  if (!limite.liberado) {
    return {
      erro: `Muitas tentativas. Tente de novo em ${Math.ceil(
        limite.esperarSegundos / 60
      )} minuto(s).`,
    };
  }

  if (!cpf || senha.length === 0) {
    await gastarTempoDeSenha();
    return { erro: CREDENCIAL_INVALIDA };
  }

  const linhas = await query<{
    id: number;
    senha_hash: string | null;
    precisa_trocar_senha: boolean;
  }>(
    "SELECT id, senha_hash, precisa_trocar_senha FROM estudantes WHERE cpf = $1",
    [cpf]
  );

  const estudante = linhas[0];

  if (!estudante) {
    // Gasta o mesmo tempo do caminho valido, para o relogio nao denunciar
    // quais CPFs existem.
    await gastarTempoDeSenha();
    return { erro: CREDENCIAL_INVALIDA };
  }

  if (!(await conferirSenha(senha, estudante.senha_hash))) {
    return { erro: CREDENCIAL_INVALIDA };
  }

  limparTentativas(`login:${await origem()}:${cpf}`);
  await abrirSessao("responsavel", estudante.id);

  redirect(estudante.precisa_trocar_senha ? "/trocar-senha" : "/portal");
}

export async function sair() {
  await fecharSessao("responsavel");
  redirect("/login");
}
