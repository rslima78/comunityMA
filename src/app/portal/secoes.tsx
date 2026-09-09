import type { ReactNode } from "react";
import {
  IconeAlerta,
  IconeCalendario,
  IconeDiversificadas,
  IconeHumanas,
  IconeLinguagens,
  IconeMegafone,
  IconeNatureza,
  IconeNotas,
  IconeWhatsapp,
} from "@/components/icones";
import { agruparPorArea, type IdDaArea } from "@/lib/areas";
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

type CorDaSecao =
  | "avisos"
  | "faltas"
  | "notas"
  | "ocorrencias"
  | "contatos";

/**
 * Cabecalho colorido de cada secao.
 *
 * A cor e' so' identidade do bloco: quem carrega significado continua sendo o
 * conteudo do cartao (vermelho de reprovacao, amarelo de atencao). Por isso a
 * faixa e' clara e o cartao segue branco -- se a secao inteira fosse colorida,
 * o alerta dentro dela perderia forca.
 *
 * O nome da variavel CSS e' montado na hora, entao vai em `style` e nao em
 * classe: o Tailwind so' gera as classes que consegue ver escritas.
 */
function Secao({
  id,
  titulo,
  contador,
  cor,
  icone,
  children,
}: {
  id: string;
  titulo: string;
  contador?: string;
  cor: CorDaSecao;
  icone: ReactNode;
  children: ReactNode;
}) {
  return (
    <section id={id} className="scroll-mt-4">
      <div
        className="mb-2 flex items-center gap-2.5 rounded-2xl px-3 py-2.5"
        style={{
          backgroundColor: `var(--color-secao-${cor}-fundo)`,
          color: `var(--color-secao-${cor})`,
        }}
      >
        <span className="flex size-8 shrink-0 items-center justify-center rounded-full bg-[var(--color-surface)]">
          {icone}
        </span>
        <h2 className="text-base font-semibold">{titulo}</h2>
        {contador ? (
          <span className="ml-auto text-xs font-medium opacity-80">
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
      cor="avisos"
      icone={<IconeMegafone className="size-4.5" />}
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

const ICONE_DA_AREA: Record<IdDaArea, ReactNode> = {
  linguagens: <IconeLinguagens className="size-4" />,
  humanas: <IconeHumanas className="size-4" />,
  natureza: <IconeNatureza className="size-4" />,
  diversificadas: <IconeDiversificadas className="size-4" />,
};

export function SecaoNotas({ notas }: { notas: NotaDaDisciplina[] }) {
  const disciplinas = notas.map(formatarDisciplina);
  const grupos = agruparPorArea(disciplinas);

  return (
    <Secao
      id="notas"
      titulo="Notas"
      cor="notas"
      icone={<IconeNotas className="size-4.5" />}
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
          <div className="flex flex-col gap-4">
            {grupos.map((grupo) => (
              <div key={grupo.id}>
                <div className="mb-1.5 flex items-center gap-1.5 px-1 text-[var(--color-text-muted)]">
                  {ICONE_DA_AREA[grupo.id]}
                  <h3 className="text-xs font-semibold uppercase tracking-wide">
                    {grupo.nome}
                  </h3>
                  <span className="text-xs">· {grupo.disciplinas.length}</span>
                </div>

                <ul className="flex flex-col gap-2">
                  {grupo.disciplinas.map((d) => (
                    <li
                      key={d.disciplina}
                      className="rounded-2xl border border-[var(--color-outline)] bg-[var(--color-surface)] p-3"
                    >
                      <div className="flex items-center justify-between gap-2">
                        <h4 className="text-sm font-semibold">{d.disciplina}</h4>
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
              </div>
            ))}
          </div>

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
    <Secao
      id="faltas"
      titulo="Faltas"
      cor="faltas"
      icone={<IconeCalendario className="size-4.5" />}
    >
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
      cor="ocorrencias"
      icone={<IconeAlerta className="size-4.5" />}
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
    <Secao
      id="contatos"
      titulo="Falar com a escola"
      cor="contatos"
      icone={<IconeWhatsapp className="size-4.5" />}
    >
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
                <IconeWhatsapp className="size-5 text-[var(--color-on-success-container)]" />
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
