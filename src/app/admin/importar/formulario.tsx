"use client";

import { useActionState, useState } from "react";
import { Alerta, Botao, Campo, Selecao } from "@/components/ui";
import {
  importarPlanilhas,
  type EstadoImportacao,
  type ResultadoDoArquivo,
  type TipoDeImportacao,
} from "./actions";

const DESCRICOES: Record<TipoDeImportacao, string> = {
  estudantes:
    "Planilha .xlsx do cadastro geral. Cria os alunos novos, atualiza os existentes e gera as senhas iniciais (data de nascimento) de quem ainda não tem. Nunca mexe na senha de quem já trocou.",
  notas:
    "Um arquivo por turma. A turma sai do nome do arquivo (ex: \"Notas - 6ºA.csv\"), então não renomeie.",
  ocorrencias:
    "Um arquivo por turma, também identificada pelo nome (ex: \"Ocorrencias 6A.csv\").",
  frequencia: "Arquivo único da escola inteira.",
};

export function FormularioImportacao({ anoPadrao }: { anoPadrao: string }) {
  const [estado, acao, enviando] = useActionState<EstadoImportacao, FormData>(
    importarPlanilhas,
    {}
  );
  const [tipo, setTipo] = useState<TipoDeImportacao>("notas");

  return (
    <div className="flex flex-col gap-4">
      <form action={acao} className="flex flex-col gap-4">
        {estado.erro ? <Alerta>{estado.erro}</Alerta> : null}

        <Selecao
          rotulo="O que você está importando"
          name="tipo"
          value={tipo}
          onChange={(e) => setTipo(e.target.value as TipoDeImportacao)}
        >
          <option value="estudantes">Cadastro de estudantes</option>
          <option value="notas">Notas</option>
          <option value="ocorrencias">Ocorrências</option>
          <option value="frequencia">Frequência</option>
        </Selecao>

        <p className="-mt-2 text-xs text-[var(--color-text-muted)]">
          {DESCRICOES[tipo]}
        </p>

        <Campo
          rotulo="Ano de referência"
          name="periodo"
          inputMode="numeric"
          defaultValue={anoPadrao}
          maxLength={4}
          required
        />

        <label className="block">
          <span className="text-sm font-medium text-[var(--color-text-muted)]">
            {tipo === "estudantes" ? "Arquivo (.xlsx)" : "Arquivos (.csv)"}
          </span>
          <input
            type="file"
            name="arquivos"
            accept={tipo === "estudantes" ? ".xlsx" : ".csv,text/csv"}
            multiple={tipo === "notas" || tipo === "ocorrencias"}
            required
            className="mt-1 block w-full rounded-xl border border-[var(--color-outline)] bg-[var(--color-canvas)] p-3 text-sm file:mr-3 file:rounded-lg file:border-0 file:bg-[var(--color-primary-container)] file:px-3 file:py-2 file:text-sm file:font-medium file:text-[var(--color-on-primary-container)]"
          />
          <span className="mt-1 block text-xs text-[var(--color-text-muted)]">
            {tipo === "notas" || tipo === "ocorrencias"
              ? "Pode escolher várias turmas de uma vez. Até 8 MB por arquivo."
              : "Um arquivo, até 8 MB."}
          </span>
        </label>

        <Botao type="submit" disabled={enviando}>
          {enviando ? "Importando..." : "Importar"}
        </Botao>

        <p className="text-xs text-[var(--color-text-muted)]">
          Reimportar o mesmo arquivo não duplica nada: os dados são
          atualizados no lugar.
        </p>
      </form>

      {estado.resultados ? <Resultados itens={estado.resultados} /> : null}
    </div>
  );
}

function Resultados({ itens }: { itens: ResultadoDoArquivo[] }) {
  return (
    <div className="flex flex-col gap-3">
      <h2 className="text-base font-semibold">Resultado</h2>
      {itens.map((item) => (
        <ResultadoDeUmArquivo key={item.arquivo} item={item} />
      ))}
    </div>
  );
}

const LIMITE_MOSTRADO = 30;

function ResultadoDeUmArquivo({ item }: { item: ResultadoDoArquivo }) {
  if (!item.ok || !item.resumo) {
    return (
      <div className="rounded-2xl border border-[var(--color-outline)] bg-[var(--color-surface)] p-4">
        <p className="text-sm font-semibold">{item.arquivo}</p>
        <div className="mt-2">
          <Alerta>{item.erro}</Alerta>
        </div>
      </div>
    );
  }

  const { contadores, pendencias, avisos } = item.resumo;
  const temProblema = pendencias.length > 0;

  return (
    <div className="rounded-2xl border border-[var(--color-outline)] bg-[var(--color-surface)] p-4">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <p className="text-sm font-semibold">{item.arquivo}</p>
        <span
          className={`rounded-full px-2.5 py-1 text-xs font-medium ${
            temProblema
              ? "bg-[var(--color-warning-container)] text-[var(--color-on-warning-container)]"
              : "bg-[var(--color-success-container)] text-[var(--color-on-success-container)]"
          }`}
        >
          {temProblema
            ? `${pendencias.length} pendência${pendencias.length === 1 ? "" : "s"}`
            : "sem pendências"}
        </span>
      </div>

      <dl className="mt-3 grid grid-cols-2 gap-x-3 gap-y-1">
        {contadores.map(([chave, valor]) => (
          <div key={chave} className="flex justify-between gap-2 text-sm">
            <dt className="truncate text-[var(--color-text-muted)]">{chave}</dt>
            <dd className="shrink-0 font-medium tabular-nums">{valor}</dd>
          </div>
        ))}
      </dl>

      {pendencias.length > 0 ? (
        <details className="mt-3">
          <summary className="cursor-pointer text-sm font-medium">
            Linhas que não entraram ({pendencias.length})
          </summary>
          <ul className="mt-2 flex flex-col gap-1">
            {pendencias.slice(0, LIMITE_MOSTRADO).map((texto, i) => (
              <li
                key={i}
                className="rounded-lg bg-[var(--color-canvas)] px-2 py-1 text-xs"
              >
                {texto}
              </li>
            ))}
          </ul>
          {pendencias.length > LIMITE_MOSTRADO ? (
            <p className="mt-1 text-xs text-[var(--color-text-muted)]">
              e mais {pendencias.length - LIMITE_MOSTRADO}.
            </p>
          ) : null}
        </details>
      ) : null}

      {avisos.length > 0 ? (
        <details className="mt-2">
          <summary className="cursor-pointer text-sm font-medium">
            Avisos ({avisos.length})
          </summary>
          <ul className="mt-2 flex flex-col gap-1">
            {avisos.slice(0, LIMITE_MOSTRADO).map((texto, i) => (
              <li
                key={i}
                className="rounded-lg bg-[var(--color-canvas)] px-2 py-1 text-xs"
              >
                {texto}
              </li>
            ))}
          </ul>
        </details>
      ) : null}
    </div>
  );
}
