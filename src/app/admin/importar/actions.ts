"use server";

import { mkdtemp, rm, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { basename, join } from "node:path";
import { revalidatePath } from "next/cache";
import { importarEstudantes } from "../../../../scripts/importadores/estudantes";
import { importarFrequencia } from "../../../../scripts/importadores/frequencia";
import { importarNotas } from "../../../../scripts/importadores/notas";
import { importarOcorrencias } from "../../../../scripts/importadores/ocorrencias";
import { definirSenhasIniciais } from "../../../../scripts/importadores/senhas";
import type { ResumoDaImportacao } from "../../../../scripts/lib/relatorio";
import { carregarSessaoAdmin } from "@/lib/auth";
import { BancoIndisponivel, comTransacao } from "@/lib/db";

export type TipoDeImportacao =
  | "estudantes"
  | "notas"
  | "ocorrencias"
  | "frequencia";

export interface ResultadoDoArquivo {
  arquivo: string;
  ok: boolean;
  /** preenchido quando o arquivo inteiro falhou */
  erro?: string;
  resumo?: ResumoDaImportacao;
}

export interface EstadoImportacao {
  erro?: string;
  resultados?: ResultadoDoArquivo[];
}

const TAMANHO_MAXIMO = 8 * 1024 * 1024;
const TIPOS: TipoDeImportacao[] = [
  "estudantes",
  "notas",
  "ocorrencias",
  "frequencia",
];

/** O cadastro vem em planilha do Excel; o resto, em CSV do SIGEDUC. */
const EXTENSAO: Record<TipoDeImportacao, RegExp> = {
  estudantes: /\.xlsx$/i,
  notas: /\.csv$/i,
  ocorrencias: /\.csv$/i,
  frequencia: /\.csv$/i,
};

/**
 * Tira qualquer coisa de caminho do nome enviado pelo navegador.
 *
 * O nome do arquivo nao e' enfeite: e' dele que sai a turma das notas e das
 * ocorrencias. Mas ele vem do cliente, entao passa por basename e por uma
 * lista de caracteres aceitos antes de virar caminho em disco.
 */
function nomeSeguro(nome: string): string {
  const base = basename(nome).replace(/\\/g, "/").split("/").pop() ?? "arquivo";
  const limpo = base.replace(/[^\p{L}\p{N} .,()_-]/gu, "").trim();
  return limpo === "" || limpo.startsWith(".") ? "arquivo.csv" : limpo.slice(0, 120);
}

/**
 * Reimporta planilhas atualizadas (nova unidade, novo bimestre).
 *
 * Cada arquivo roda na sua propria transacao: se um deles estiver corrompido,
 * os outros ja importados continuam valendo. Dentro de cada arquivo, uma linha
 * problematica vira pendencia e nao derruba as demais.
 */
export async function importarPlanilhas(
  _anterior: EstadoImportacao,
  dados: FormData
): Promise<EstadoImportacao> {
  if (!(await carregarSessaoAdmin())) {
    return { erro: "Sessao expirada. Entre de novo para importar." };
  }

  const tipo = String(dados.get("tipo") ?? "") as TipoDeImportacao;
  if (!TIPOS.includes(tipo)) {
    return { erro: "Escolha o que voce esta importando." };
  }

  const periodo = String(dados.get("periodo") ?? "").trim();
  if (!/^\d{4}$/.test(periodo)) {
    return { erro: "Informe o ano de referencia com 4 digitos." };
  }

  const arquivos = dados
    .getAll("arquivos")
    .filter((a): a is File => a instanceof File && a.size > 0);

  if (arquivos.length === 0) {
    return { erro: "Escolha ao menos um arquivo." };
  }

  for (const arquivo of arquivos) {
    if (arquivo.size > TAMANHO_MAXIMO) {
      return {
        erro: `"${arquivo.name}" tem mais de 8 MB. Nenhum arquivo foi importado.`,
      };
    }
    if (!EXTENSAO[tipo].test(arquivo.name)) {
      const esperado = tipo === "estudantes" ? ".xlsx" : ".csv";
      return {
        erro: `"${arquivo.name}" nao e um ${esperado}. Nenhum arquivo foi importado.`,
      };
    }
  }

  // Os importadores leem de um caminho em disco, e a turma sai do nome do
  // arquivo -- por isso o upload e' gravado com o nome original.
  const pasta = await mkdtemp(join(tmpdir(), "comunityma-"));
  const resultados: ResultadoDoArquivo[] = [];

  try {
    for (const arquivo of arquivos) {
      const nome = nomeSeguro(arquivo.name);
      const caminho = join(pasta, nome);
      await writeFile(caminho, Buffer.from(await arquivo.arrayBuffer()));

      try {
        const resumos = await comTransacao(async (db) => {
          if (tipo === "estudantes") {
            // O cadastro tambem gera as senhas iniciais de quem ainda nao tem;
            // sem isso os alunos novos entrariam sem conseguir acessar.
            const cadastro = await importarEstudantes(db, caminho);
            const senhas = await definirSenhasIniciais(db);
            return [cadastro.resumo(), senhas.resumo()];
          }

          const relatorio =
            tipo === "notas"
              ? await importarNotas(db, caminho, periodo)
              : tipo === "ocorrencias"
                ? await importarOcorrencias(db, caminho)
                : await importarFrequencia(db, caminho, periodo);
          return [relatorio.resumo()];
        });

        for (const [i, resumo] of resumos.entries()) {
          resultados.push({
            arquivo: i === 0 ? nome : resumo.titulo,
            ok: true,
            resumo,
          });
        }
      } catch (erro) {
        console.error(`[importacao] ${nome} falhou:`, erro);
        resultados.push({
          arquivo: nome,
          ok: false,
          erro:
            erro instanceof BancoIndisponivel
              ? "O banco de dados nao respondeu. Nada deste arquivo foi gravado."
              : `Nao foi possivel ler este arquivo. Nada dele foi gravado. (${
                  (erro as Error)?.message?.split("\n")[0] ?? "erro desconhecido"
                })`,
        });
      }
    }
  } finally {
    await rm(pasta, { recursive: true, force: true });
  }

  revalidatePath("/admin");
  return { resultados };
}
