/**
 * Cria ou atualiza o administrador inicial a partir de variaveis de ambiente.
 *
 *   ADMIN_USER=coordenacao ADMIN_PASSWORD=... npm run seed-admin
 *
 * Nao existe tela publica de cadastro de admin de proposito: a unica forma de
 * criar um e' com acesso ao ambiente do servidor. Rodar de novo com a mesma
 * senha nao muda nada; com senha diferente, troca a senha do usuario.
 */
import { conectar } from "./lib/conexao";
import { gerarHash } from "../src/lib/senha";

const MINIMO_SENHA = 10;

async function main() {
  const usuario = process.env.ADMIN_USER?.trim().toLowerCase();
  const senha = process.env.ADMIN_PASSWORD;

  if (!usuario || !senha) {
    console.error(
      "\n  defina ADMIN_USER e ADMIN_PASSWORD antes de rodar.\n" +
        "  em desenvolvimento, no .env.local; no Railway, em Variables.\n"
    );
    process.exit(1);
  }

  if (senha.length < MINIMO_SENHA) {
    console.error(
      `\n  ADMIN_PASSWORD precisa ter pelo menos ${MINIMO_SENHA} caracteres.\n`
    );
    process.exit(1);
  }

  const db = await conectar();
  try {
    const { rows } = await db.query<{ id: number; criado: boolean }>(
      `INSERT INTO admins (usuario, senha_hash)
       VALUES ($1, $2)
       ON CONFLICT (usuario) DO UPDATE SET senha_hash = EXCLUDED.senha_hash
       RETURNING id, (xmax = 0) AS criado`,
      [usuario, await gerarHash(senha)]
    );
    console.log(
      `\n  admin "${usuario}" ${rows[0].criado ? "criado" : "atualizado"} (id ${rows[0].id}).\n`
    );
  } finally {
    await db.end();
  }
}

main().catch((erro) => {
  console.error(erro);
  process.exit(1);
});
