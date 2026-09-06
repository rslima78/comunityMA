import type { Executor } from "../../src/lib/casamento";
import { gerarHash } from "../../src/lib/senha";
import { Relatorio } from "../lib/relatorio";

/**
 * Define a senha inicial de quem ainda nao tem: a data de nascimento no
 * formato DDMMAAAA, com troca obrigatoria no primeiro acesso.
 *
 * So' mexe em estudantes com senha_hash nula. Quem ja' trocou a senha nunca e'
 * afetado -- reimportar o cadastro nao pode devolver a senha de ninguem para
 * a data de nascimento.
 *
 * A data e' formatada pelo proprio Postgres (to_char) em vez de passar por um
 * Date do JavaScript, para o fuso do servidor nao empurrar a data um dia para
 * tras e gerar uma senha que ninguem consegue adivinhar.
 */
export async function definirSenhasIniciais(db: Executor) {
  const relatorio = new Relatorio("Senhas iniciais");

  const { rows } = await db.query<{
    id: number;
    nome: string;
    cpf: string | null;
    senha_inicial: string | null;
  }>(
    `SELECT id, nome, cpf, to_char(nascimento, 'DDMMYYYY') AS senha_inicial
     FROM estudantes
     WHERE senha_hash IS NULL
     ORDER BY id`
  );

  relatorio.contar("estudantes sem senha", rows.length);

  for (const estudante of rows) {
    if (!estudante.senha_inicial) {
      relatorio.pendencia(
        `${estudante.nome} (id ${estudante.id}) sem data de nascimento -- ` +
          "ficou sem senha e nao consegue entrar"
      );
      continue;
    }

    if (!estudante.cpf) {
      relatorio.pendencia(
        `${estudante.nome} (id ${estudante.id}) sem CPF -- ` +
          "senha definida, mas nao ha' usuario para o login"
      );
    }

    await db.query(
      `UPDATE estudantes
       SET senha_hash = $1, precisa_trocar_senha = TRUE
       WHERE id = $2 AND senha_hash IS NULL`,
      [await gerarHash(estudante.senha_inicial), estudante.id]
    );
    relatorio.contar("senhas definidas");
  }

  return relatorio;
}
