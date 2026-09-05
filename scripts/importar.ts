/**
 * Importacao das planilhas da escola.
 *
 *   npm run importar -- estudantes  "estudantes.xlsx"
 *   npm run importar -- notas       "Notas - 6ºA.csv"        [--periodo=2026]
 *   npm run importar -- ocorrencias "Ocorrencias 6A.csv"
 *   npm run importar -- frequencia  "frequencia.csv"         [--periodo=2026]
 *   npm run importar -- familias
 *
 * Cada comando roda dentro de uma transacao: ou a planilha inteira entra, ou
 * nada entra. Linhas que nao casaram nao abortam a importacao -- viram
 * pendencia no relatorio, que e' impresso no fim e gravado em relatorios/.
 */
import { existsSync } from "node:fs";
import type { Client } from "pg";
import { conectar } from "./lib/conexao";
import type { Relatorio } from "./lib/relatorio";
import { importarEstudantes } from "./importadores/estudantes";
import { importarFamilias } from "./importadores/familias";
import { importarFrequencia } from "./importadores/frequencia";
import { importarNotas } from "./importadores/notas";
import { importarOcorrencias } from "./importadores/ocorrencias";

const COMANDOS = ["estudantes", "notas", "ocorrencias", "frequencia", "familias"] as const;
type Comando = (typeof COMANDOS)[number];

function ajuda(): never {
  console.error(
    [
      "",
      "  uso: npm run importar -- <comando> <arquivo> [--periodo=ANO]",
      "",
      "  comandos:",
      "    estudantes  <estudantes.xlsx>   cadastro geral (upsert por matricula)",
      "                                    e ja regenera as familias",
      "    notas       <Notas - TURMA.csv> um arquivo de turma por vez",
      "    ocorrencias <Ocorrencias TURMA.csv>",
      "    frequencia  <frequencia.csv>    arquivo unico da escola inteira",
      "    familias                        so' reagrupa as familias",
      "",
      "  --periodo=ANO  ano de referencia de notas e frequencia" +
        " (padrao: " + new Date().getFullYear() + ")",
      "",
    ].join("\n")
  );
  process.exit(1);
}

async function main() {
  const args = process.argv.slice(2);
  const comando = args[0] as Comando | undefined;
  const arquivo = args.find((a, i) => i > 0 && !a.startsWith("--"));
  const periodo =
    args.find((a) => a.startsWith("--periodo="))?.split("=")[1] ??
    String(new Date().getFullYear());

  if (!comando || !COMANDOS.includes(comando)) ajuda();
  if (comando !== "familias") {
    if (!arquivo) ajuda();
    if (!existsSync(arquivo)) {
      console.error("\n  arquivo nao encontrado: " + arquivo + "\n");
      process.exit(1);
    }
  }

  const db: Client = await conectar();
  let relatorio: Relatorio;
  let relatorioFamilias: Relatorio | null = null;

  try {
    await db.query("BEGIN");

    switch (comando) {
      case "estudantes":
        relatorio = await importarEstudantes(db, arquivo!);
        // As familias saem da filiacao do proprio cadastro, entao nao faz
        // sentido deixar o agrupamento desatualizado depois de importar.
        relatorioFamilias = await importarFamilias(db);
        break;
      case "notas":
        relatorio = await importarNotas(db, arquivo!, periodo);
        break;
      case "ocorrencias":
        relatorio = await importarOcorrencias(db, arquivo!);
        break;
      case "frequencia":
        relatorio = await importarFrequencia(db, arquivo!, periodo);
        break;
      case "familias":
        relatorio = await importarFamilias(db);
        break;
    }

    await db.query("COMMIT");
  } catch (erro) {
    await db.query("ROLLBACK");
    console.error("\n  importacao abortada, nada foi gravado.\n");
    throw erro;
  } finally {
    await db.end();
  }

  relatorio.finalizar();
  relatorioFamilias?.finalizar();

  const pendencias =
    relatorio.totalPendencias + (relatorioFamilias?.totalPendencias ?? 0);

  if (pendencias > 0) {
    console.log(
      "  " + pendencias + " registro(s) sem correspondencia. " +
        "Os dados que casaram foram gravados.\n"
    );
  }
}

main().catch((erro) => {
  console.error(erro);
  process.exit(1);
});
