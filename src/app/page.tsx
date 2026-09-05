/**
 * Pagina de diagnostico da Etapa 1 -- nao e' a interface do portal.
 * Serve so' para confirmar que o app sobe e enxerga o banco.
 */
export const dynamic = "force-dynamic";

const TABELAS = [
  "estudantes",
  "responsaveis",
  "responsavel_estudante",
  "admins",
  "notas",
  "ocorrencias",
  "frequencia",
  "avisos",
];

async function checarBanco() {
  try {
    const { query } = await import("@/lib/db");
    const rows = await query<{ tablename: string }>(
      "SELECT tablename FROM pg_tables WHERE schemaname = 'public'"
    );
    const encontradas = new Set(rows.map((r) => r.tablename));
    return {
      ok: true as const,
      faltando: TABELAS.filter((t) => !encontradas.has(t)),
    };
  } catch (erro) {
    return { ok: false as const, mensagem: (erro as Error).message };
  }
}

export default async function Home() {
  const status = await checarBanco();

  return (
    <main className="mx-auto max-w-lg p-4">
      <h1 className="text-xl font-semibold">Portal COMUNITYMA</h1>
      <p className="mt-1 text-sm text-[var(--color-text-muted)]">
        Etapa 1 — estrutura e banco. Sem telas e sem login ainda.
      </p>

      <div className="mt-4 rounded-[var(--radius-card)] border border-[var(--color-outline)] bg-[var(--color-surface)] p-4">
        {!status.ok ? (
          <>
            <p className="font-medium text-[var(--color-danger)]">
              Banco inacessivel
            </p>
            <p className="mt-1 text-sm text-[var(--color-text-muted)]">
              {status.mensagem}
            </p>
          </>
        ) : status.faltando.length > 0 ? (
          <>
            <p className="font-medium text-[var(--color-warning)]">
              Conectado, mas faltam tabelas
            </p>
            <p className="mt-1 text-sm text-[var(--color-text-muted)]">
              Rode <code>npm run migrate</code>. Faltando:{" "}
              {status.faltando.join(", ")}
            </p>
          </>
        ) : (
          <>
            <p className="font-medium text-[var(--color-success)]">
              Banco conectado, 8 tabelas criadas
            </p>
            <p className="mt-1 text-sm text-[var(--color-text-muted)]">
              {TABELAS.join(" · ")}
            </p>
          </>
        )}
      </div>
    </main>
  );
}
