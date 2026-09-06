import { mkdirSync, writeFileSync } from "node:fs";
import { join } from "node:path";

type Nivel = "pendencia" | "aviso";

export interface ResumoDaImportacao {
  titulo: string;
  contadores: [string, number][];
  pendencias: string[];
  avisos: string[];
}

/**
 * Coleta o que a importacao nao conseguiu resolver.
 *
 * A regra do projeto e' nunca falhar em silencio: toda linha que nao casou,
 * casou de forma duvidosa ou veio malformada aparece aqui, e o resumo final
 * diz quantas foram. O arquivo de detalhe contem nomes de alunos, por isso
 * vai para relatorios/, que esta' no .gitignore.
 */
export class Relatorio {
  private linhas: { nivel: Nivel; texto: string }[] = [];
  readonly contadores = new Map<string, number>();

  constructor(private readonly titulo: string) {}

  contar(chave: string, quantidade = 1) {
    this.contadores.set(chave, (this.contadores.get(chave) ?? 0) + quantidade);
  }

  pendencia(texto: string) {
    this.linhas.push({ nivel: "pendencia", texto });
    this.contar("pendencias");
  }

  aviso(texto: string) {
    this.linhas.push({ nivel: "aviso", texto });
    this.contar("avisos");
  }

  get totalPendencias() {
    return this.contadores.get("pendencias") ?? 0;
  }

  /**
   * Mesmo conteudo do relatorio, em dados, para a tela de importacao do
   * admin. No Railway o disco e' efemero, entao la' o relatorio nao pode
   * depender de arquivo: ele e' devolvido e mostrado na hora.
   */
  resumo(): ResumoDaImportacao {
    return {
      titulo: this.titulo,
      contadores: [...this.contadores],
      pendencias: this.linhas
        .filter((l) => l.nivel === "pendencia")
        .map((l) => l.texto),
      avisos: this.linhas.filter((l) => l.nivel === "aviso").map((l) => l.texto),
    };
  }

  /** Imprime o resumo e grava o detalhe. Devolve o caminho do arquivo, se houver. */
  finalizar(): string | null {
    console.log(`\n${this.titulo}`);
    console.log("-".repeat(this.titulo.length));
    for (const [chave, valor] of this.contadores) {
      console.log(`  ${chave.padEnd(28)} ${valor}`);
    }

    if (this.linhas.length === 0) {
      console.log("\n  nenhuma pendencia.\n");
      return null;
    }

    const pendencias = this.linhas.filter((l) => l.nivel === "pendencia");
    const avisos = this.linhas.filter((l) => l.nivel === "aviso");

    console.log(
      `\n  ${pendencias.length} pendencia(s) e ${avisos.length} aviso(s).`
    );
    for (const linha of this.linhas.slice(0, 10)) {
      console.log(`    [${linha.nivel}] ${linha.texto}`);
    }
    if (this.linhas.length > 10) {
      console.log(`    ... mais ${this.linhas.length - 10}, ver o arquivo.`);
    }

    mkdirSync("relatorios", { recursive: true });
    const carimbo = new Date().toISOString().replace(/[:.]/g, "-").slice(0, 19);
    const arquivo = join(
      "relatorios",
      `${this.titulo.toLowerCase().replace(/[^a-z0-9]+/g, "-")}-${carimbo}.txt`
    );

    const conteudo = [
      this.titulo,
      new Date().toLocaleString("pt-BR"),
      "",
      ...[...this.contadores].map(([k, v]) => `${k}: ${v}`),
      "",
      "PENDENCIAS",
      ...(pendencias.length ? pendencias.map((l) => `  ${l.texto}`) : ["  (nenhuma)"]),
      "",
      "AVISOS",
      ...(avisos.length ? avisos.map((l) => `  ${l.texto}`) : ["  (nenhum)"]),
      "",
    ].join("\n");

    writeFileSync(arquivo, conteudo, "utf8");
    console.log(`\n  detalhe em ${arquivo}\n`);
    return arquivo;
  }
}
