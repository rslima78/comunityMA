import {
  diasFaltados,
  DIAS_LETIVOS,
  formatarDias,
  formatarNota,
  formatarDisciplina,
  FREQUENCIA_MINIMA,
  MEDIA_APROVACAO,
  percentualDeFrequencia,
  type AvisoDoEstudante,
  type FrequenciaDoEstudante,
  type NotaDaDisciplina,
  type OcorrenciaDoEstudante,
} from "@/lib/portal";

const dataHora = new Intl.DateTimeFormat("pt-BR", {
  dateStyle: "short",
  timeStyle: "short",
  timeZone: "America/Bahia",
});

const somenteData = new Intl.DateTimeFormat("pt-BR", {
  dateStyle: "short",
  timeZone: "America/Bahia",
});

function Secao({
  id,
  titulo,
  contador,
  destaque = false,
  children,
}: {
  id: string;
  titulo: string;
  contador?: string;
  destaque?: boolean;
  children: React.ReactNode;
}) {
  return (
    <section id={id} className="scroll-mt-4">
      <div className="mb-2 flex items-baseline justify-between px-1">
        <h2
          className={
            destaque ? "text-lg font-semibold" : "text-base font-semibold"
          }
        >
          {titulo}
        </h2>
        {contador ? (
          <span className="text-xs text-[var(--color-text-muted)]">
            {contador}
          </span>
        ) : null}
      </div>
      {children}
    </section>
  );
}

function Vazio({ children }: { children: React.ReactNode }) {
  return (
    <div className="rounded-2xl border border-dashed border-[var(--color-outline)] p-4">
      <p className="text-sm text-[var(--color-text-muted)]">{children}</p>
    </div>
  );
}

export function SecaoAvisos({ avisos }: { avisos: AvisoDoEstudante[] }) {
  return (
    <Secao
      id="avisos"
      titulo="Avisos"
      destaque
      contador={avisos.length > 0 ? `${avisos.length}` : undefined}
    >
      {avisos.length === 0 ? (
        <Vazio>Nenhum aviso da escola por enquanto.</Vazio>
      ) : (
        <ul className="flex flex-col gap-2">
          {avisos.map((aviso) => (
            <li
              key={aviso.id}
              className="rounded-2xl border-l-4 border-[var(--color-primary)] bg-[var(--color-surface)] p-4 shadow-[0_1px_3px_rgba(32,33,36,0.06)] ring-1 ring-[var(--color-outline)]"
            >
              <div className="flex flex-wrap items-center gap-2">
                <span
                  className={`inline-flex rounded-full px-2.5 py-1 text-xs font-medium ${
                    aviso.turma
                      ? "bg-[var(--color-primary-container)] text-[var(--color-on-primary-container)]"
                      : "bg-[var(--color-success-container)] text-[var(--color-on-success-container)]"
                  }`}
                >
                  {aviso.turma ? `Turma ${aviso.turma}` : "Individual"}
                </span>
                <span className="text-xs text-[var(--color-text-muted)]">
                  {dataHora.format(new Date(aviso.data_envio))}
                </span>
              </div>
              <h3 className="mt-2 font-semibold">{aviso.titulo}</h3>
              <p className="mt-1 whitespace-pre-wrap text-sm">
                {aviso.mensagem}
              </p>
            </li>
          ))}
        </ul>
      )}
    </Secao>
  );
}

function ValorDaNota({
  rotulo,
  valor,
}: {
  rotulo: string;
  valor: number | null;
}) {
  const abaixo = valor !== null && valor < MEDIA_APROVACAO;
  return (
    <div className="flex flex-col items-center gap-0.5">
      <span className="text-[10px] uppercase tracking-wide text-[var(--color-text-muted)]">
        {rotulo}
      </span>
      <span
        className={`text-sm font-semibold tabular-nums ${
          abaixo
            ? "rounded-md bg-[var(--color-danger-container)] px-1.5 text-[var(--color-on-danger-container)]"
            : valor === null
              ? "text-[var(--color-text-muted)]"
              : ""
        }`}
      >
        {formatarNota(valor)}
      </span>
    </div>
  );
}

export function SecaoNotas({ notas }: { notas: NotaDaDisciplina[] }) {
  const disciplinas = notas.map(formatarDisciplina);

  return (
    <Secao
      id="notas"
      titulo="Notas"
      contador={
        disciplinas.length > 0
          ? `${disciplinas.length} disciplina${disciplinas.length === 1 ? "" : "s"}`
          : undefined
      }
    >
      {disciplinas.length === 0 ? (
        <Vazio>Nenhuma nota lançada até agora.</Vazio>
      ) : (
        <>
          <ul className="flex flex-col gap-2">
            {disciplinas.map((d) => (
              <li
                key={d.disciplina}
                className="rounded-2xl border border-[var(--color-outline)] bg-[var(--color-surface)] p-3"
              >
                <div className="flex items-center justify-between gap-2">
                  <h3 className="text-sm font-semibold">{d.disciplina}</h3>
                  <div className="flex shrink-0 items-center gap-1.5">
                    <span className="text-[10px] uppercase tracking-wide text-[var(--color-text-muted)]">
                      Média final
                    </span>
                    <span
                      className={`rounded-lg px-2 py-0.5 text-base font-bold tabular-nums ${
                        d.mediaFinal === null
                          ? "text-[var(--color-text-muted)]"
                          : d.mediaFinal < MEDIA_APROVACAO
                            ? "bg-[var(--color-danger-container)] text-[var(--color-on-danger-container)]"
                            : "bg-[var(--color-success-container)] text-[var(--color-on-success-container)]"
                      }`}
                    >
                      {formatarNota(d.mediaFinal)}
                    </span>
                  </div>
                </div>

                <div className="mt-3 grid grid-cols-5 gap-1 border-t border-[var(--color-outline)] pt-2">
                  {d.unidades.map((u) => (
                    <ValorDaNota
                      key={u.rotulo}
                      rotulo={u.rotulo}
                      valor={u.valor}
                    />
                  ))}
                  <ValorDaNota rotulo="Anual" valor={d.mediaAnual} />
                  <ValorDaNota rotulo="Exame" valor={d.exameFinal} />
                </div>
              </li>
            ))}
          </ul>

          <p className="mt-2 px-1 text-xs text-[var(--color-text-muted)]">
            Notas abaixo de {formatarNota(MEDIA_APROVACAO)} aparecem em
            vermelho. O travessão (—) quer dizer que a nota ainda não foi
            lançada.
          </p>
        </>
      )}
    </Secao>
  );
}

export function SecaoFaltas({
  frequencia,
}: {
  frequencia: FrequenciaDoEstudante | null;
}) {
  // A tela fala em frequencia, e nao em faltas: e' o numero que a Secretaria
  // usa (minimo de 75% para aprovar) e o que a familia ouve na reuniao.
  const presenca = percentualDeFrequencia(frequencia);
  const abaixoDoMinimo = presenca !== null && presenca < FREQUENCIA_MINIMA;
  const dias = diasFaltados(frequencia);
  const faltas = frequencia?.total_faltas ?? 0;

  return (
    <Secao id="faltas" titulo="Faltas">
      {!frequencia ? (
        <Vazio>Nenhum registro de frequência até agora.</Vazio>
      ) : (
        <div className="rounded-2xl border border-[var(--color-outline)] bg-[var(--color-surface)] p-4">
          <div className="flex items-end justify-between gap-3">
            <div>
              <p className="text-3xl font-bold tabular-nums">
                {presenca === null
                  ? "—"
                  : `${presenca.toFixed(1).replace(".", ",")}%`}
              </p>
              <p className="text-xs uppercase tracking-wide text-[var(--color-text-muted)]">
                de frequência
              </p>
              <p className="mt-1 text-sm text-[var(--color-text-muted)]">
                {faltas} falta{faltas === 1 ? "" : "s"}
                {dias !== null ? (
                  <>
                    {" "}
                    <span className="font-medium">
                      ({formatarDias(dias)} dia{dias === 1 ? "" : "s"})
                    </span>
                  </>
                ) : null}
                {frequencia.total_aulas !== null && frequencia.total_aulas > 0
                  ? ` em ${frequencia.total_aulas} aulas`
                  : ""}
              </p>
            </div>
            <span
              className={`shrink-0 rounded-full px-2.5 py-1 text-xs font-medium ${
                abaixoDoMinimo
                  ? "bg-[var(--color-danger-container)] text-[var(--color-on-danger-container)]"
                  : "bg-[var(--color-success-container)] text-[var(--color-on-success-container)]"
              }`}
            >
              {abaixoDoMinimo ? "Abaixo do mínimo" : "Frequência adequada"}
            </span>
          </div>

          {presenca !== null ? (
            <div
              className="mt-3 h-2 w-full overflow-hidden rounded-full bg-[var(--color-surface-high)]"
              role="img"
              aria-label={`${presenca.toFixed(1)}% de frequência`}
            >
              <div
                className={`h-full rounded-full ${
                  abaixoDoMinimo
                    ? "bg-[var(--color-danger)]"
                    : "bg-[var(--color-success)]"
                }`}
                style={{ width: `${presenca}%` }}
              />
            </div>
          ) : null}

          <p className="mt-3 text-xs text-[var(--color-text-muted)]">
            É preciso {FREQUENCIA_MINIMA}% de frequência para aprovação.{" "}
            {frequencia.total_aulas !== null && frequencia.total_aulas > 0
              ? "Calculado sobre o total de aulas dadas."
              : `Cada 5 faltas equivalem a 1 dia de aula, sobre ${DIAS_LETIVOS} dias letivos.`}{" "}
            Totais do período {frequencia.periodo}.
          </p>
        </div>
      )}
    </Secao>
  );
}

/** Suspensao pesa mais que advertencia; o resto fica neutro. */
function tomDaOcorrencia(tipo: string) {
  const normalizado = tipo.toUpperCase();
  if (normalizado.includes("SUSPENS")) {
    return "bg-[var(--color-danger-container)] text-[var(--color-on-danger-container)]";
  }
  if (normalizado.includes("ADVERT")) {
    return "bg-[var(--color-warning-container)] text-[var(--color-on-warning-container)]";
  }
  return "bg-[var(--color-surface-high)] text-[var(--color-text-muted)]";
}

export function SecaoOcorrencias({
  ocorrencias,
}: {
  ocorrencias: OcorrenciaDoEstudante[];
}) {
  return (
    <Secao
      id="ocorrencias"
      titulo="Ocorrências"
      contador={ocorrencias.length > 0 ? `${ocorrencias.length}` : undefined}
    >
      {ocorrencias.length === 0 ? (
        <Vazio>Nenhuma ocorrência registrada.</Vazio>
      ) : (
        <ul className="flex flex-col gap-2">
          {ocorrencias.map((ocorrencia) => (
            <li
              key={ocorrencia.id}
              className="rounded-2xl border border-[var(--color-outline)] bg-[var(--color-surface)] p-4"
            >
              <div className="flex flex-wrap items-center gap-2">
                <span
                  className={`inline-flex rounded-full px-2.5 py-1 text-xs font-medium ${tomDaOcorrencia(
                    ocorrencia.tipo
                  )}`}
                >
                  {ocorrencia.tipo}
                </span>
                <span className="text-xs text-[var(--color-text-muted)]">
                  {ocorrencia.data
                    ? somenteData.format(new Date(ocorrencia.data))
                    : "sem data"}
                </span>
              </div>
              {ocorrencia.descricao ? (
                <p className="mt-2 whitespace-pre-wrap text-sm">
                  {ocorrencia.descricao}
                </p>
              ) : null}
            </li>
          ))}
        </ul>
      )}
    </Secao>
  );
}
