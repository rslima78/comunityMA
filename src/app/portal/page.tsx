import { Botao } from "@/components/ui";
import { exigirResponsavel } from "@/lib/auth";
import { sair } from "../login/actions";

export const dynamic = "force-dynamic";

/**
 * Area autenticada do responsavel. As secoes de Notas, Faltas, Ocorrencias e
 * Avisos entram na Etapa 5 -- aqui so' se confirma que a sessao funciona.
 *
 * A sessao vale para um unico estudante: quem tem mais de um filho entra com
 * o CPF de cada um, um de cada vez.
 */
export default async function PaginaPortal() {
  const { estudante } = await exigirResponsavel();

  return (
    <main className="mx-auto w-full max-w-md p-4">
      <h1 className="text-xl font-semibold">{estudante.nome}</h1>
      <p className="text-sm text-[var(--color-text-muted)]">
        {estudante.serie} · {estudante.turma} · matricula {estudante.matricula}
      </p>

      <div className="mt-4 rounded-2xl border border-[var(--color-outline)] bg-[var(--color-surface)] p-4">
        <p className="text-sm text-[var(--color-text-muted)]">
          As secoes de notas, faltas, ocorrencias e avisos chegam na Etapa 5.
        </p>
      </div>

      <form action={sair} className="mt-4">
        <Botao type="submit">Sair</Botao>
      </form>
    </main>
  );
}
