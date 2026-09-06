import { Botao } from "@/components/ui";
import { exigirAdmin } from "@/lib/auth";
import { sairAdmin } from "./login/actions";

export const dynamic = "force-dynamic";

/**
 * Area autenticada do administrador. A composicao e o historico de avisos
 * entram na Etapa 4.
 */
export default async function PaginaAdmin() {
  const admin = await exigirAdmin();

  return (
    <main className="mx-auto w-full max-w-md p-4">
      <h1 className="text-xl font-semibold">Administracao</h1>
      <p className="text-sm text-[var(--color-text-muted)]">
        Conectado como {admin.usuario}
      </p>

      <div className="mt-4 rounded-2xl border border-[var(--color-outline)] bg-[var(--color-surface)] p-4">
        <p className="text-sm text-[var(--color-text-muted)]">
          O envio de avisos por turma ou por estudante chega na Etapa 4.
        </p>
      </div>

      <form action={sairAdmin} className="mt-4">
        <Botao type="submit">Sair</Botao>
      </form>
    </main>
  );
}
