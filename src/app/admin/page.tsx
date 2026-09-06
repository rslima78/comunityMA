import { Cartao, Etiqueta } from "@/components/ui";
import { exigirAdmin } from "@/lib/auth";
import {
  LIMITE_HISTORICO,
  listarAvisos,
  listarTurmas,
} from "@/lib/avisos";
import { bancoPrincipal } from "@/lib/db";
import { FormularioAviso } from "./formulario-aviso";
import { sairAdmin } from "./login/actions";

export const dynamic = "force-dynamic";

const formatador = new Intl.DateTimeFormat("pt-BR", {
  dateStyle: "short",
  timeStyle: "short",
  timeZone: "America/Bahia",
});

export default async function PaginaAdmin() {
  const admin = await exigirAdmin();

  // As turmas saem do proprio cadastro -- nao existe lista fixa em lugar
  // nenhum, entao turma nova aparece aqui assim que o cadastro for importado.
  const turmas = await listarTurmas(bancoPrincipal);
  const avisos = await listarAvisos(bancoPrincipal);

  return (
    <main className="mx-auto flex w-full max-w-md flex-col gap-4 p-4">
      <header className="flex items-start justify-between gap-2 px-1">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Avisos</h1>
          <p className="text-sm text-[var(--color-text-muted)]">
            Conectado como {admin.usuario}
          </p>
        </div>
        <div className="flex shrink-0 gap-2">
          <a
            href="/admin/importar"
            className="rounded-xl border border-[var(--color-outline)] px-3 py-2 text-sm font-medium"
          >
            Importar
          </a>
          <form action={sairAdmin}>
            <button
              type="submit"
              className="rounded-xl border border-[var(--color-outline)] px-3 py-2 text-sm font-medium"
            >
              Sair
            </button>
          </form>
        </div>
      </header>

      <Cartao>
        <h2 className="mb-4 text-base font-semibold">Novo aviso</h2>
        <FormularioAviso turmas={turmas} />
      </Cartao>

      <section className="flex flex-col gap-2">
        <h2 className="px-1 text-base font-semibold">
          Enviados
          {avisos.length === LIMITE_HISTORICO
            ? ` (ultimos ${LIMITE_HISTORICO})`
            : avisos.length > 0
              ? ` (${avisos.length})`
              : ""}
        </h2>

        {avisos.length === 0 ? (
          <Cartao>
            <p className="text-sm text-[var(--color-text-muted)]">
              Nenhum aviso enviado ainda.
            </p>
          </Cartao>
        ) : (
          avisos.map((aviso) => (
            <article
              key={aviso.id}
              className="rounded-2xl border border-[var(--color-outline)] bg-[var(--color-surface)] p-4"
            >
              <div className="flex flex-wrap items-center gap-2">
                {aviso.turma ? (
                  <Etiqueta tom="turma">
                    Turma {aviso.turma} · {aviso.alcance} estudante
                    {aviso.alcance === 1 ? "" : "s"}
                  </Etiqueta>
                ) : (
                  <Etiqueta tom="estudante">
                    {aviso.estudante_nome ?? "estudante removido"}
                    {aviso.estudante_turma ? ` · ${aviso.estudante_turma}` : ""}
                  </Etiqueta>
                )}
                <span className="text-xs text-[var(--color-text-muted)]">
                  {formatador.format(new Date(aviso.data_envio))}
                </span>
              </div>

              <h3 className="mt-2 font-semibold">{aviso.titulo}</h3>
              <p className="mt-1 whitespace-pre-wrap text-sm text-[var(--color-text-muted)]">
                {aviso.mensagem}
              </p>
              <p className="mt-2 text-xs text-[var(--color-text-muted)]">
                por {aviso.autor}
              </p>
            </article>
          ))
        )}
      </section>
    </main>
  );
}
