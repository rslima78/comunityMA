import { createHmac, timingSafeEqual } from "node:crypto";
import { cookies } from "next/headers";

/**
 * Sessoes em cookie assinado (HMAC-SHA256). Sem tabela de sessao: o portal e'
 * pequeno e a validade curta ja resolve.
 *
 * Os dois perfis usam cookies com nomes diferentes E assinaturas com escopos
 * diferentes, entao um cookie de responsavel nao vale como admin nem o
 * contrario, mesmo que alguem troque o nome do cookie.
 */

const COOKIE_RESPONSAVEL = "ma_responsavel";
const COOKIE_ADMIN = "ma_admin";
export const DURACAO_SEGUNDOS = 60 * 60 * 8; // 8 horas

export type Escopo = "responsavel" | "admin";

export interface Conteudo {
  /** id do estudante (responsavel) ou do admin */
  id: number;
  escopo: Escopo;
  /** epoch em segundos */
  exp: number;
}

function segredo(): string {
  const valor = process.env.SESSION_SECRET;
  if (!valor || valor.length < 32) {
    throw new Error(
      "SESSION_SECRET ausente ou curta demais (minimo 32 caracteres). " +
        "Gere uma com: node -e \"console.log(require('crypto').randomBytes(32).toString('hex'))\""
    );
  }
  return valor;
}

function assinar(carga: string, escopo: Escopo): string {
  return createHmac("sha256", segredo())
    .update(`${escopo}.${carga}`)
    .digest("base64url");
}

export function montarToken(conteudo: Conteudo): string {
  const carga = Buffer.from(JSON.stringify(conteudo)).toString("base64url");
  return `${carga}.${assinar(carga, conteudo.escopo)}`;
}

export function abrirToken(
  valor: string | undefined,
  escopo: Escopo
): Conteudo | null {
  if (!valor) return null;

  const [carga, assinatura] = valor.split(".");
  if (!carga || !assinatura) return null;

  const esperada = Buffer.from(assinar(carga, escopo));
  const recebida = Buffer.from(assinatura);
  if (
    esperada.length !== recebida.length ||
    !timingSafeEqual(esperada, recebida)
  ) {
    return null;
  }

  try {
    const conteudo = JSON.parse(
      Buffer.from(carga, "base64url").toString("utf8")
    ) as Conteudo;

    // O escopo tambem vai assinado, mas conferir de novo protege contra um
    // cookie renomeado de um perfil para o outro.
    if (conteudo.escopo !== escopo) return null;
    if (typeof conteudo.id !== "number") return null;
    if (conteudo.exp * 1000 < Date.now()) return null;

    return conteudo;
  } catch {
    return null;
  }
}

function opcoesCookie() {
  return {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax" as const,
    path: "/",
    maxAge: DURACAO_SEGUNDOS,
  };
}

const NOME: Record<Escopo, string> = {
  responsavel: COOKIE_RESPONSAVEL,
  admin: COOKIE_ADMIN,
};

export async function abrirSessao(escopo: Escopo, id: number) {
  const conteudo: Conteudo = {
    id,
    escopo,
    exp: Math.floor(Date.now() / 1000) + DURACAO_SEGUNDOS,
  };
  const jar = await cookies();
  jar.set(NOME[escopo], montarToken(conteudo), opcoesCookie());
}

export async function lerSessao(escopo: Escopo): Promise<number | null> {
  const jar = await cookies();
  const conteudo = abrirToken(jar.get(NOME[escopo])?.value, escopo);
  return conteudo?.id ?? null;
}

export async function fecharSessao(escopo: Escopo) {
  const jar = await cookies();
  jar.delete(NOME[escopo]);
}
