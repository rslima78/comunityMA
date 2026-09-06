import { Botao } from "@/components/ui";
import { exigirResponsavel } from "@/lib/auth";
import { sair } from "../login/actions";

export const dynamic = "force-dynamic";

/**
 * Area autenticada do responsavel. As secoes de Notas, Faltas, Ocorrencias e
 * Avisos entram na Etapa 5 -- aqui so' se confirma que a sessao funciona e
 * que os irmaos foram carregados.
 */
export default async function PaginaPortal() {
  const sessao = await exigirResponsavel();

  return (
    <main className="mx-auto w-full max-w-md p-4">
      <h1 className="text-xl font-semibold">{sessao.estudante.nome}</h1>
      <p className="text-sm text-[var(--color-text-muted)]">
        {sessao.estudante.serie} · {sessao.estudante.turma} · matricula{" "}
        {sessao.estudante.matricula}
      </p>

      <div className="mt-4 rounded-2xl border border-[var(--color-outline)] bg-[var(--color-surface)] p-4">
        <h2 className="text-sm font-semibold">
          Estudantes desta familia ({sessao.acessiveis.length})
        </h2>
        <ul className="mt-2 flex flex-col gap-2">
          {sessao.acessiveis.map((estudante) => (
            <li
              key={estudante.id}
              className="flex items-center justify-between gap-2 rounded-xl bg-[var(--color-canvas)] px-3 py-2"
            >
              <span className="text-sm">{estudante.nome}</span>
              <span className="text-xs text-[var(--color-text-muted)]">
                {estudante.turma ?? "-"}
              </span>
            </li>
          ))}
        </ul>
        <p className="mt-3 text-xs text-[var(--color-text-muted)]">
          As secoes de notas, faltas, ocorrencias e avisos chegam na Etapa 5.
        </p>
      </div>

      <form action={sair} className="mt-4">
        <Botao type="submit">Sair</Botao>
      </form>
    </main>
  );
}
