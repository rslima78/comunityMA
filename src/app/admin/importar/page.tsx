import { Cartao } from "@/components/ui";
import { exigirAdmin } from "@/lib/auth";
import { FormularioImportacao } from "./formulario";

export const dynamic = "force-dynamic";

export default async function PaginaImportar() {
  await exigirAdmin();

  return (
    <main className="mx-auto flex w-full max-w-md flex-col gap-4 p-4">
      <header className="flex items-start justify-between gap-2 px-1">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Importar</h1>
          <p className="text-sm text-[var(--color-text-muted)]">
            Planilhas atualizadas de notas, ocorrências e frequência.
          </p>
        </div>
        <a
          href="/admin"
          className="shrink-0 rounded-xl border border-[var(--color-outline)] px-3 py-2 text-sm font-medium"
        >
          Voltar
        </a>
      </header>

      <Cartao>
        <FormularioImportacao anoPadrao={String(new Date().getFullYear())} />
      </Cartao>

      <p className="px-1 text-xs text-[var(--color-text-muted)]">
        O cadastro de estudantes (estudantes.xlsx) continua sendo importado
        pela linha de comando, porque cria logins e senhas iniciais.
      </p>
    </main>
  );
}
