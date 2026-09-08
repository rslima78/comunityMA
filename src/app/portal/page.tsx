import { exigirResponsavel } from "@/lib/auth";
import { bancoPrincipal } from "@/lib/db";
import {
  avisosDoEstudante,
  frequenciaDoEstudante,
  notasDoEstudante,
  ocorrenciasDoEstudante,
} from "@/lib/portal";
import { sair } from "../login/actions";
import {
  SecaoAvisos,
  SecaoFaltas,
  SecaoNotas,
  SecaoOcorrencias,
} from "./secoes";

export const dynamic = "force-dynamic";

const ATALHOS = [
  ["#avisos", "Avisos"],
  ["#notas", "Notas"],
  ["#faltas", "Faltas"],
  ["#ocorrencias", "Ocorrências"],
] as const;

/**
 * Tela unica do responsavel, somente leitura.
 *
 * Tudo e' buscado pelo id que veio da sessao assinada -- nao existe parametro
 * de estudante na URL para alguem trocar. Um login enxerga um estudante.
 */
export default async function PaginaPortal() {
  const { estudante, usandoSenhaInicial } = await exigirResponsavel();

  const [avisos, notas, frequencia, ocorrencias] = await Promise.all([
    avisosDoEstudante(bancoPrincipal, estudante.id),
    notasDoEstudante(bancoPrincipal, estudante.id),
    frequenciaDoEstudante(bancoPrincipal, estudante.id),
    ocorrenciasDoEstudante(bancoPrincipal, estudante.id),
  ]);

  return (
    <div className="mx-auto w-full max-w-lg pb-10">
      <header className="sticky top-0 z-10 border-b border-[var(--color-outline)] bg-[var(--color-surface)]/95 px-4 py-3 backdrop-blur">
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0">
            <h1 className="truncate text-lg font-semibold leading-tight">
              {estudante.nome}
            </h1>
            <p className="truncate text-xs text-[var(--color-text-muted)]">
              {[estudante.serie, estudante.turma].filter(Boolean).join(" · ")}
              {estudante.matricula ? ` · matrícula ${estudante.matricula}` : ""}
            </p>
          </div>
          <form action={sair}>
            <button
              type="submit"
              className="shrink-0 rounded-xl border border-[var(--color-outline)] px-3 py-2 text-sm font-medium"
            >
              Sair
            </button>
          </form>
        </div>

        <nav className="-mx-1 mt-3 flex gap-1.5 overflow-x-auto pb-0.5">
          {ATALHOS.map(([destino, texto]) => (
            <a
              key={destino}
              href={destino}
              className="shrink-0 rounded-full bg-[var(--color-surface-high)] px-3 py-1.5 text-xs font-medium text-[var(--color-text-muted)]"
            >
              {texto}
            </a>
          ))}
        </nav>
      </header>

      <main className="flex flex-col gap-6 p-4">
        {usandoSenhaInicial ? (
          <a
            href="/trocar-senha"
            className="flex items-center justify-between gap-3 rounded-2xl border border-[var(--color-outline)] bg-[var(--color-warning-container)] px-4 py-3 text-[var(--color-on-warning-container)]"
          >
            <span className="text-sm">
              Sua senha ainda é a data de nascimento, que outras pessoas podem
              saber. <strong className="font-semibold">Trocar agora</strong>
            </span>
            <span aria-hidden className="shrink-0 text-lg">
              ›
            </span>
          </a>
        ) : null}

        <SecaoAvisos avisos={avisos} />
        <SecaoNotas notas={notas} />
        <SecaoFaltas frequencia={frequencia} />
        <SecaoOcorrencias ocorrencias={ocorrencias} />

        <a
          href="/trocar-senha"
          className="mt-2 text-center text-sm font-medium text-[var(--color-primary)] underline"
        >
          Trocar minha senha
        </a>
      </main>
    </div>
  );
}
