import type { ComponentProps, ReactNode } from "react";

/**
 * Pecas visuais compartilhadas pelas telas de acesso, seguindo o DESIGN.md:
 * alvo de toque de 48px, cantos arredondados e as cores semanticas.
 */

export function Cartao({ children }: { children: ReactNode }) {
  return (
    <div className="rounded-2xl border border-[var(--color-outline)] bg-[var(--color-surface)] p-6 shadow-[0_1px_3px_rgba(32,33,36,0.06),0_1px_2px_rgba(32,33,36,0.04)]">
      {children}
    </div>
  );
}

export function Tela({
  titulo,
  descricao,
  children,
}: {
  titulo: string;
  descricao?: string;
  children: ReactNode;
}) {
  return (
    <main className="mx-auto flex min-h-dvh w-full max-w-md flex-col justify-center gap-4 p-4">
      <div className="px-2">
        <h1 className="text-2xl font-semibold tracking-tight">{titulo}</h1>
        {descricao ? (
          <p className="mt-1 text-sm text-[var(--color-text-muted)]">
            {descricao}
          </p>
        ) : null}
      </div>
      <Cartao>{children}</Cartao>
    </main>
  );
}

export function Campo({
  rotulo,
  dica,
  ...props
}: { rotulo: string; dica?: string } & ComponentProps<"input">) {
  return (
    <label className="block">
      <span className="text-sm font-medium text-[var(--color-text-muted)]">
        {rotulo}
      </span>
      <input
        {...props}
        className="mt-1 h-12 w-full rounded-xl border border-[var(--color-outline)] bg-[var(--color-canvas)] px-3 text-base outline-none focus:border-[var(--color-primary)] focus:ring-1 focus:ring-[var(--color-primary)]"
      />
      {dica ? (
        <span className="mt-1 block text-xs text-[var(--color-text-muted)]">
          {dica}
        </span>
      ) : null}
    </label>
  );
}

export function Botao({
  children,
  ...props
}: ComponentProps<"button">) {
  return (
    <button
      {...props}
      className="h-12 w-full rounded-xl bg-[var(--color-primary)] text-base font-medium text-white transition-opacity disabled:opacity-60"
    >
      {children}
    </button>
  );
}

export function Alerta({
  tipo = "erro",
  children,
}: {
  tipo?: "erro" | "aviso";
  children: ReactNode;
}) {
  const cores =
    tipo === "erro"
      ? "bg-[var(--color-danger-container)] text-[var(--color-on-danger-container)]"
      : "bg-[var(--color-warning-container)] text-[var(--color-on-warning-container)]";

  return (
    <p role="alert" className={`rounded-xl px-3 py-2 text-sm ${cores}`}>
      {children}
    </p>
  );
}

export function AreaTexto({
  rotulo,
  dica,
  ...props
}: { rotulo: string; dica?: string } & ComponentProps<"textarea">) {
  return (
    <label className="block">
      <span className="text-sm font-medium text-[var(--color-text-muted)]">
        {rotulo}
      </span>
      <textarea
        {...props}
        className="mt-1 min-h-32 w-full rounded-xl border border-[var(--color-outline)] bg-[var(--color-canvas)] px-3 py-2 text-base outline-none focus:border-[var(--color-primary)] focus:ring-1 focus:ring-[var(--color-primary)]"
      />
      {dica ? (
        <span className="mt-1 block text-xs text-[var(--color-text-muted)]">
          {dica}
        </span>
      ) : null}
    </label>
  );
}

export function Selecao({
  rotulo,
  children,
  ...props
}: { rotulo: string } & ComponentProps<"select">) {
  return (
    <label className="block">
      <span className="text-sm font-medium text-[var(--color-text-muted)]">
        {rotulo}
      </span>
      <select
        {...props}
        className="mt-1 h-12 w-full rounded-xl border border-[var(--color-outline)] bg-[var(--color-canvas)] px-3 text-base outline-none focus:border-[var(--color-primary)] focus:ring-1 focus:ring-[var(--color-primary)]"
      >
        {children}
      </select>
    </label>
  );
}

export function Etiqueta({
  tom,
  children,
}: {
  tom: "turma" | "estudante";
  children: ReactNode;
}) {
  const cores =
    tom === "turma"
      ? "bg-[var(--color-primary-container)] text-[var(--color-on-primary-container)]"
      : "bg-[var(--color-success-container)] text-[var(--color-on-success-container)]";

  return (
    <span
      className={`inline-flex items-center rounded-full px-2.5 py-1 text-xs font-medium ${cores}`}
    >
      {children}
    </span>
  );
}
