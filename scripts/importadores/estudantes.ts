import readXlsxFile from "read-excel-file/node";
import type { Executor } from "../../src/lib/casamento";
import {
  normalizarCpf,
  normalizarData,
  normalizarInteiro,
  normalizarMatricula,
  normalizarNome,
} from "../../src/lib/normalizar";
import { Relatorio } from "../lib/relatorio";

const COLUNAS = [
  "ESTUDANTE",
  "MATRICULA",
  "CPF",
  "SERIE",
  "TURMA",
  "NASCIMENTO",
  "IDADE",
  "NOME MÃE",
  "NOME PAI",
] as const;

/**
 * Importa o cadastro geral (estudantes.xlsx).
 *
 * Upsert por matricula: se ja existe um cadastro com aquela matricula, ele e'
 * atualizado (inclusive a turma, para o aluno que mudou de turma no ano). Se a
 * propria planilha trouxer a mesma matricula duas vezes, a segunda vira
 * pendencia -- escolher uma das duas em silencio seria chutar.
 */
export async function importarEstudantes(db: Executor, arquivo: string) {
  const relatorio = new Relatorio("Importacao de estudantes");
  const linhas = desembrulhar(await readXlsxFile(arquivo));

  if (linhas.length === 0) {
    relatorio.pendencia("planilha vazia");
    return relatorio;
  }

  const cabecalho = linhas[0].map((c) => String(c ?? "").trim());
  const indice = new Map(cabecalho.map((nome, i) => [nome, i]));

  const faltando = COLUNAS.filter((c) => !indice.has(c));
  if (faltando.length > 0) {
    relatorio.pendencia(
      `colunas ausentes na planilha: ${faltando.join(", ")}. ` +
        `encontradas: ${cabecalho.join(", ")}`
    );
    return relatorio;
  }

  const valor = (linha: unknown[], coluna: string) => linha[indice.get(coluna)!];
  const vistas = new Map<string, number>();

  for (let i = 1; i < linhas.length; i++) {
    const linha = linhas[i];
    const numeroLinha = i + 1;

    const nome = String(valor(linha, "ESTUDANTE") ?? "").trim();
    const matricula = normalizarMatricula(valor(linha, "MATRICULA"));

    if (!nome) {
      relatorio.pendencia(`linha ${numeroLinha}: sem nome do estudante`);
      continue;
    }
    if (!matricula) {
      relatorio.pendencia(`linha ${numeroLinha}: ${nome} sem matricula`);
      continue;
    }

    const jaVista = vistas.get(matricula);
    if (jaVista) {
      relatorio.pendencia(
        `linha ${numeroLinha}: matricula ${matricula} (${nome}) repetida na planilha, ` +
          `ja aparecia na linha ${jaVista} -- linha ignorada`
      );
      continue;
    }
    vistas.set(matricula, numeroLinha);

    const cpfBruto = valor(linha, "CPF");
    const cpf = normalizarCpf(cpfBruto);
    if (cpfBruto != null && String(cpfBruto).trim() !== "" && cpf === null) {
      relatorio.aviso(
        `linha ${numeroLinha}: ${nome} com CPF invalido ("${String(cpfBruto)}") -- gravado sem CPF`
      );
    }

    const campos = {
      nome,
      nome_normalizado: normalizarNome(nome),
      matricula,
      cpf,
      serie: textoOuNulo(valor(linha, "SERIE")),
      turma: textoOuNulo(valor(linha, "TURMA")),
      nascimento: normalizarData(valor(linha, "NASCIMENTO")),
      idade: normalizarInteiro(valor(linha, "IDADE")),
      nome_mae: textoOuNulo(valor(linha, "NOME MÃE")),
      nome_pai: textoOuNulo(valor(linha, "NOME PAI")),
    };

    if (campos.nascimento === null && valor(linha, "NASCIMENTO") != null) {
      relatorio.aviso(
        `linha ${numeroLinha}: ${nome} com nascimento em formato inesperado ` +
          `("${String(valor(linha, "NASCIMENTO"))}") -- gravado sem data`
      );
    }

    const existentes = await db.query<{ id: number }>(
      "SELECT id FROM estudantes WHERE matricula = $1",
      [matricula]
    );

    if (existentes.rows.length > 1) {
      relatorio.pendencia(
        `matricula ${matricula} (${nome}) ja tem ${existentes.rows.length} cadastros no banco -- nao atualizado`
      );
      continue;
    }

    if (existentes.rows.length === 1) {
      await db.query(
        `UPDATE estudantes SET
           nome = $1, nome_normalizado = $2, cpf = $3, serie = $4, turma = $5,
           nascimento = $6, idade = $7, nome_mae = $8, nome_pai = $9
         WHERE id = $10`,
        [
          campos.nome,
          campos.nome_normalizado,
          campos.cpf,
          campos.serie,
          campos.turma,
          campos.nascimento,
          campos.idade,
          campos.nome_mae,
          campos.nome_pai,
          existentes.rows[0].id,
        ]
      );
      relatorio.contar("atualizados");
    } else {
      await db.query(
        `INSERT INTO estudantes
           (nome, nome_normalizado, matricula, cpf, serie, turma,
            nascimento, idade, nome_mae, nome_pai)
         VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10)`,
        [
          campos.nome,
          campos.nome_normalizado,
          campos.matricula,
          campos.cpf,
          campos.serie,
          campos.turma,
          campos.nascimento,
          campos.idade,
          campos.nome_mae,
          campos.nome_pai,
        ]
      );
      relatorio.contar("inseridos");
    }

    relatorio.contar("linhas lidas");
  }

  return relatorio;
}

/**
 * O read-excel-file devolve [{ sheet, data }] -- uma entrada por aba da
 * planilha -- e nao a matriz de celulas direto. Esta funcao aceita as duas
 * formas para nao quebrar se a lib mudar isso de novo.
 */
function desembrulhar(resultado: unknown): unknown[][] {
  if (!Array.isArray(resultado) || resultado.length === 0) return [];

  const primeira = resultado[0];
  if (Array.isArray(primeira)) return resultado as unknown[][];

  if (primeira && typeof primeira === "object" && "data" in primeira) {
    const dados = (primeira as { data: unknown }).data;
    return Array.isArray(dados) ? (dados as unknown[][]) : [];
  }

  return [];
}

function textoOuNulo(valor: unknown): string | null {
  if (valor == null) return null;
  const texto = String(valor).trim();
  return texto === "" ? null : texto;
}
