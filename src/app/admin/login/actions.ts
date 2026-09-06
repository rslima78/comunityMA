"use server";

import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { query } from "@/lib/db";
import { limparTentativas, registrarTentativa } from "@/lib/limite";
import { conferirSenha, gastarTempoDeSenha } from "@/lib/senha";
import { abrirSessao, fecharSessao } from "@/lib/sessao";

export interface EstadoLoginAdmin {
  erro?: string;
}

const CREDENCIAL_INVALIDA = "Usuario ou senha invalidos.";

async function origem(): Promise<string> {
  const cabecalhos = await headers();
  return (
    cabecalhos.get("x-forwarded-for")?.split(",")[0]?.trim() ??
    cabecalhos.get("x-real-ip") ??
    "desconhecido"
  );
}

/**
 * Login do administrador, contra a tabela admins.
 *
 * Nunca consulta estudantes: o perfil administrativo e' uma identidade
 * separada, e a sessao que sai daqui vale so' para /admin.
 */
export async function entrarAdmin(
  _anterior: EstadoLoginAdmin,
  dados: FormData
): Promise<EstadoLoginAdmin> {
  const usuario = String(dados.get("usuario") ?? "")
    .trim()
    .toLowerCase();
  const senha = String(dados.get("senha") ?? "");

  const chave = `admin:${await origem()}:${usuario}`;
  const limite = registrarTentativa(chave);
  if (!limite.liberado) {
    return {
      erro: `Muitas tentativas. Tente de novo em ${Math.ceil(
        limite.esperarSegundos / 60
      )} minuto(s).`,
    };
  }

  if (!usuario || !senha) {
    await gastarTempoDeSenha();
    return { erro: CREDENCIAL_INVALIDA };
  }

  const linhas = await query<{ id: number; senha_hash: string }>(
    "SELECT id, senha_hash FROM admins WHERE lower(usuario) = $1",
    [usuario]
  );

  const admin = linhas[0];
  if (!admin) {
    await gastarTempoDeSenha();
    return { erro: CREDENCIAL_INVALIDA };
  }

  if (!(await conferirSenha(senha, admin.senha_hash))) {
    return { erro: CREDENCIAL_INVALIDA };
  }

  limparTentativas(chave);
  await abrirSessao("admin", admin.id);
  redirect("/admin");
}

export async function sairAdmin() {
  await fecharSessao("admin");
  redirect("/admin/login");
}
