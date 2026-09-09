import {
  CONTATOS,
  exibirTelefone,
  linkDoWhatsapp,
} from "@/lib/contatos";
import {
  diasFaltados,
  DIAS_LETIVOS,
  formatarDias,
  formatarNota,
  formatarDisciplina,
  faixaDeFrequencia,
  FREQUENCIA_ATENCAO,
  FREQUENCIA_REPROVACAO_DIRETA,
  MEDIA_APROVACAO,
  percentualDeFrequencia,
  type NivelDeFrequencia,
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

/**
 * Cor e rotulo de cada faixa de frequencia.
 *
 * So' a faixa de reprovacao afirma reprovacao -- as outras duas sao alerta da
 * escola, e o texto delas nao pode soar como veredito da Secretaria.
 */
const ESTILO_DA_FAIXA: Record<
  NivelDeFrequencia,
  { rotulo: string; etiqueta: string; barra: string }
> = {
  reprovado: {
    rotulo: "Reprovado por faltas",
    etiqueta:
      "bg-[var(--color-danger-container)] text-[var(--color-on-danger-container)]",
    barra: "bg-[var(--color-danger)]",
  },
  perigo: {
    rotulo: "Frequência crítica",
    etiqueta:
      "bg-[var(--color-danger-container)] text-[var(--color-on-danger-container)]",
    barra: "bg-[var(--color-danger)]",
  },
  atencao: {
    rotulo: "Frequência baixa",
    etiqueta:
      "bg-[var(--color-warning-container)] text-[var(--color-on-warning-container)]",
    barra: "bg-[var(--color-warning)]",
  },
  regular: {
    rotulo: "Sem reprovação por faltas",
    etiqueta:
      "bg-[var(--color-success-container)] text-[var(--color-on-success-container)]",
    barra: "bg-[var(--color-success)]",
  },
};

function RecadoDaFrequencia({ faixa }: { faixa: NivelDeFrequencia }) {
  if (faixa === "reprovado") {
    return (
      <p className="mt-3 rounded-xl bg-[var(--color-danger-container)] px-3 py-2 text-sm font-medium text-[var(--color-on-danger-container)]">
        A frequência está em {FREQUENCIA_REPROVACAO_DIRETA}% ou menos. Por essa
        regra da Secretaria de Educação, o estudante é reprovado por faltas
        mesmo que as notas estejam boas.{" "}
        <strong className="font-bold">
          Procure a escola com urgência.
        </strong>
      </p>
    );
  }

  if (faixa === "perigo") {
    return (
      <p className="mt-3 rounded-xl bg-[var(--color-danger-container)] px-3 py-2 text-sm font-medium text-[var(--color-on-danger-container)]">
        A frequência está muito baixa e perto do limite de{" "}
        {FREQUENCIA_REPROVACAO_DIRETA}%, em que a reprovação por faltas acontece
        mesmo com notas boas. Procure a escola.
      </p>
    );
  }

  if (faixa === "atencao") {
    return (
      <p className="mt-3 rounded-xl bg-[var(--color-warning-container)] px-3 py-2 text-sm text-[var(--color-on-warning-container)]">
        A frequência está abaixo de {FREQUENCIA_ATENCAO}%. Com{" "}
        {FREQUENCIA_REPROVACAO_DIRETA}% ou menos, o estudante é reprovado por
        faltas independentemente das notas.
      </p>
    );
  }

  return (
    <p className="mt-3 text-sm text-[var(--color-text-muted)]">
      Com {FREQUENCIA_REPROVACAO_DIRETA}% ou menos de frequência, o estudante é
      reprovado direto por faltas, independentemente das notas.
    </p>
  );
}

export function SecaoFaltas({
  frequencia,
}: {
  frequencia: FrequenciaDoEstudante | null;
}) {
  // A tela fala em frequencia, e nao em faltas: e' o numero que a Secretaria
  // usa e o que a familia ouve na reuniao.
  const presenca = percentualDeFrequencia(frequencia);
  const faixa = faixaDeFrequencia(presenca) ?? "regular";
  const estilo = ESTILO_DA_FAIXA[faixa];
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
              className={`shrink-0 rounded-full px-2.5 py-1 text-center text-xs font-medium ${estilo.etiqueta}`}
            >
              {estilo.rotulo}
            </span>
          </div>

          {presenca !== null ? (
            <div
              className="mt-3 h-2 w-full overflow-hidden rounded-full bg-[var(--color-surface-high)]"
              role="img"
              aria-label={`${presenca.toFixed(1)}% de frequência`}
            >
              <div
                className={`h-full rounded-full ${estilo.barra}`}
                style={{ width: `${presenca}%` }}
              />
            </div>
          ) : null}

          <RecadoDaFrequencia faixa={faixa} />

          <p className="mt-2 text-xs text-[var(--color-text-muted)]">
            {frequencia.total_aulas !== null && frequencia.total_aulas > 0
              ? "Frequência calculada sobre o total de aulas dadas."
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

export function SecaoContatos({
  estudante,
}: {
  estudante: { nome: string; turma: string | null };
}) {
  return (
    <Secao id="contatos" titulo="Falar com a escola">
      <ul className="flex flex-col gap-2">
        {CONTATOS.map((contato) => (
          <li key={contato.telefone}>
            <a
              href={linkDoWhatsapp(contato.telefone, estudante)}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-3 rounded-2xl border border-[var(--color-outline)] bg-[var(--color-surface)] p-4"
            >
              <span
                aria-hidden
                className="flex size-10 shrink-0 items-center justify-center rounded-full bg-[var(--color-success-container)]"
              >
                <svg
                  viewBox="0 0 24 24"
                  className="size-5 fill-[var(--color-on-success-container)]"
                >
                  <path d="M12.04 2C6.58 2 2.13 6.45 2.13 11.91c0 1.75.46 3.45 1.32 4.95L2 22l5.25-1.38a9.9 9.9 0 0 0 4.79 1.22h.01c5.46 0 9.91-4.45 9.91-9.91 0-2.65-1.03-5.14-2.9-7.01A9.82 9.82 0 0 0 12.04 2Zm0 18.15h-.01a8.2 8.2 0 0 1-4.19-1.15l-.3-.18-3.12.82.83-3.04-.2-.31a8.2 8.2 0 0 1-1.26-4.38c0-4.54 3.7-8.24 8.25-8.24 2.2 0 4.27.86 5.83 2.42a8.2 8.2 0 0 1 2.41 5.83c0 4.54-3.7 8.23-8.24 8.23Zm4.52-6.16c-.25-.12-1.47-.72-1.69-.81-.23-.08-.39-.12-.56.13-.16.24-.64.8-.78.97-.15.16-.29.18-.53.06-.25-.13-1.05-.39-1.99-1.23-.74-.66-1.23-1.47-1.38-1.72-.14-.25-.01-.38.11-.5.11-.11.25-.29.37-.44.13-.15.17-.25.25-.42.08-.16.04-.31-.02-.43-.06-.12-.56-1.34-.76-1.84-.2-.48-.4-.42-.56-.43h-.47c-.16 0-.43.06-.65.31-.22.25-.85.83-.85 2.03s.87 2.35.99 2.51c.12.16 1.71 2.61 4.15 3.66.58.25 1.03.4 1.39.51.58.19 1.11.16 1.53.1.47-.07 1.47-.6 1.67-1.18.21-.58.21-1.07.15-1.18-.06-.11-.22-.17-.47-.29Z" />
                </svg>
              </span>
              <span className="min-w-0">
                <span className="block text-sm font-semibold">
                  {contato.cargo}
                  {contato.nome ? ` · ${contato.nome}` : ""}
                </span>
                <span className="block text-xs text-[var(--color-text-muted)]">
                  {exibirTelefone(contato.telefone)} · abrir conversa no
                  WhatsApp
                </span>
              </span>
            </a>
          </li>
        ))}
      </ul>
    </Secao>
  );
}
