import { randomBytes, scrypt, timingSafeEqual } from "node:crypto";
import { promisify } from "node:util";

const derivar = promisify(scrypt) as (
  senha: string,
  sal: Buffer,
  tamanho: number,
  opcoes: { N: number; r: number; p: number; maxmem: number }
) => Promise<Buffer>;

// Parametros do scrypt. N=16384 com r=8 usa ~16MB por hash, o que torna um
// ataque de dicionario caro sem pesar no servidor de uma escola.
const N = 16384;
const R = 8;
const P = 1;
const TAMANHO = 64;
const MAXMEM = 64 * 1024 * 1024;

/**
 * Hash de senha usando scrypt, que vem no proprio Node -- sem dependencia
 * nativa para compilar no Railway.
 *
 * Formato: scrypt$N$r$p$sal$hash (tudo em base64), para que os parametros
 * possam mudar no futuro sem invalidar as senhas ja gravadas.
 */
export async function gerarHash(senha: string): Promise<string> {
  const sal = randomBytes(16);
  const hash = await derivar(senha.normalize("NFKC"), sal, TAMANHO, {
    N,
    r: R,
    p: P,
    maxmem: MAXMEM,
  });
  return [
    "scrypt",
    N,
    R,
    P,
    sal.toString("base64"),
    hash.toString("base64"),
  ].join("$");
}

/**
 * Confere a senha em tempo constante. Devolve false (nunca lanca) para hash
 * ausente ou corrompido, para que o chamador trate tudo como "credencial
 * invalida" sem distinguir os casos.
 */
export async function conferirSenha(
  senha: string,
  hashGuardado: string | null
): Promise<boolean> {
  if (!hashGuardado) return false;

  const partes = hashGuardado.split("$");
  if (partes.length !== 6 || partes[0] !== "scrypt") return false;

  const [, nTexto, rTexto, pTexto, salBase64, hashBase64] = partes;
  const sal = Buffer.from(salBase64, "base64");
  const esperado = Buffer.from(hashBase64, "base64");

  try {
    const calculado = await derivar(
      senha.normalize("NFKC"),
      sal,
      esperado.length,
      {
        N: Number(nTexto),
        r: Number(rTexto),
        p: Number(pTexto),
        maxmem: MAXMEM,
      }
    );
    return (
      calculado.length === esperado.length &&
      timingSafeEqual(calculado, esperado)
    );
  } catch {
    return false;
  }
}

/**
 * Gasta o mesmo tempo de um scrypt de verdade.
 *
 * Sem isso, um CPF inexistente responderia bem mais rapido que um CPF valido
 * com senha errada, e daria para descobrir quais CPFs estao cadastrados
 * cronometrando as respostas -- exatamente o que a mensagem de erro generica
 * tenta esconder.
 */
export async function gastarTempoDeSenha(): Promise<void> {
  await conferirSenha(
    "senha-que-nao-existe",
    await gerarHash("senha-que-nao-existe")
  );
}

/** Senha inicial do estudante: a data de nascimento como DDMMAAAA. */
export function senhaInicialDeData(nascimento: Date | null): string | null {
  if (!nascimento) return null;
  const dia = String(nascimento.getDate()).padStart(2, "0");
  const mes = String(nascimento.getMonth() + 1).padStart(2, "0");
  return `${dia}${mes}${nascimento.getFullYear()}`;
}

export const REGRAS_SENHA = {
  minimo: 6,
  maximo: 72,
};

/** Devolve o motivo da recusa, ou null se a senha serve. */
export function validarNovaSenha(
  senha: string,
  senhaAtual: string
): string | null {
  if (senha.length < REGRAS_SENHA.minimo) {
    return `A nova senha precisa ter pelo menos ${REGRAS_SENHA.minimo} caracteres.`;
  }
  if (senha.length > REGRAS_SENHA.maximo) {
    return `A nova senha pode ter no maximo ${REGRAS_SENHA.maximo} caracteres.`;
  }
  if (senha === senhaAtual) {
    return "A nova senha precisa ser diferente da atual.";
  }
  if (/^\d{8}$/.test(senha)) {
    return "Escolha uma senha que nao seja apenas uma data.";
  }
  return null;
}
