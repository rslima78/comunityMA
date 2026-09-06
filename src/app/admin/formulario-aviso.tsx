"use client";

import { useActionState, useEffect, useRef, useState } from "react";
import { Alerta, AreaTexto, Botao, Campo, Selecao } from "@/components/ui";
import type { EstudanteEncontrado, TurmaDisponivel } from "@/lib/avisos";
import { buscarEstudantes, enviarAviso, type EstadoAviso } from "./actions";

/**
 * Casca do formulario: guarda o resultado da acao e mostra o recado.
 *
 * A limpeza depois de um envio bem-sucedido e' feita pela `key` dos campos,
 * que muda para o id do aviso recem-gravado. Remontar zera de uma vez os
 * campos e a busca, sem nenhum efeito sincronizando estado -- e como o id e'
 * sempre novo, mandar duas vezes o mesmo texto tambem limpa.
 */
export function FormularioAviso({ turmas }: { turmas: TurmaDisponivel[] }) {
  const [estado, acao, enviando] = useActionState<EstadoAviso, FormData>(
    enviarAviso,
    {}
  );

  return (
    <div className="flex flex-col gap-4">
      {estado.erro ? <Alerta>{estado.erro}</Alerta> : null}
      {estado.sucesso ? (
        <p
          role="status"
          className="rounded-xl bg-[var(--color-success-container)] px-3 py-2 text-sm text-[var(--color-on-success-container)]"
        >
          {estado.sucesso}
        </p>
      ) : null}

      <CamposDoAviso
        key={estado.avisoId ?? "inicial"}
        turmas={turmas}
        acao={acao}
        enviando={enviando}
      />
    </div>
  );
}

function CamposDoAviso({
  turmas,
  acao,
  enviando,
}: {
  turmas: TurmaDisponivel[];
  acao: (dados: FormData) => void;
  enviando: boolean;
}) {
  const [tipoDestino, setTipoDestino] = useState<"turma" | "estudante">("turma");
  const [termo, setTermo] = useState("");
  const [resultados, setResultados] = useState<EstudanteEncontrado[]>([]);
  const [buscando, setBuscando] = useState(false);
  const [escolhido, setEscolhido] = useState<EstudanteEncontrado | null>(null);

  const temporizador = useRef<ReturnType<typeof setTimeout> | null>(null);
  // Cada busca leva um numero; so' a mais recente pode escrever o resultado,
  // senao uma consulta lenta antiga sobrescreveria a nova.
  const buscaAtual = useRef(0);

  useEffect(
    () => () => {
      if (temporizador.current) clearTimeout(temporizador.current);
    },
    []
  );

  function aoDigitar(valor: string) {
    setTermo(valor);
    if (temporizador.current) clearTimeout(temporizador.current);

    const texto = valor.trim();
    if (texto.length < 2) {
      buscaAtual.current++;
      setResultados([]);
      setBuscando(false);
      return;
    }

    setBuscando(true);
    const minhaVez = ++buscaAtual.current;

    // Espera a digitacao parar: sem isso seria uma consulta por tecla.
    temporizador.current = setTimeout(async () => {
      const achados = await buscarEstudantes(texto);
      if (minhaVez !== buscaAtual.current) return;
      setResultados(achados);
      setBuscando(false);
    }, 300);
  }

  return (
    <form action={acao} className="flex flex-col gap-4">
      <Campo
        rotulo="Titulo"
        name="titulo"
        maxLength={120}
        required
        placeholder="Reuniao de pais"
      />

      <AreaTexto
        rotulo="Mensagem"
        name="mensagem"
        maxLength={2000}
        required
        placeholder="Escreva aqui o que as familias precisam saber."
      />

      <fieldset className="flex flex-col gap-2">
        <legend className="text-sm font-medium text-[var(--color-text-muted)]">
          Destino
        </legend>

        <div className="flex gap-2">
          {(
            [
              ["turma", "Turma inteira"],
              ["estudante", "Estudante especifico"],
            ] as const
          ).map(([valor, texto]) => (
            <label
              key={valor}
              className={`flex h-12 flex-1 cursor-pointer items-center justify-center rounded-xl border px-3 text-center text-sm font-medium ${
                tipoDestino === valor
                  ? "border-[var(--color-primary)] bg-[var(--color-primary-container)] text-[var(--color-on-primary-container)]"
                  : "border-[var(--color-outline)] text-[var(--color-text-muted)]"
              }`}
            >
              <input
                type="radio"
                name="tipo_destino"
                value={valor}
                checked={tipoDestino === valor}
                onChange={() => setTipoDestino(valor)}
                className="sr-only"
              />
              {texto}
            </label>
          ))}
        </div>
      </fieldset>

      {tipoDestino === "turma" ? (
        <Selecao rotulo="Turma" name="turma" required defaultValue="">
          <option value="" disabled>
            Escolha a turma
          </option>
          {turmas.map((t) => (
            <option key={t.turma} value={t.turma}>
              {t.turma} — {t.estudantes} estudante
              {t.estudantes === 1 ? "" : "s"}
            </option>
          ))}
        </Selecao>
      ) : escolhido ? (
        <div className="flex items-center justify-between gap-2 rounded-xl border border-[var(--color-primary)] bg-[var(--color-primary-container)] px-3 py-2">
          <div>
            <p className="text-sm font-medium text-[var(--color-on-primary-container)]">
              {escolhido.nome}
            </p>
            <p className="text-xs text-[var(--color-on-primary-container)]">
              {escolhido.turma ?? "sem turma"} · matricula {escolhido.matricula}
            </p>
          </div>
          <button
            type="button"
            onClick={() => {
              setEscolhido(null);
              setTermo("");
              setResultados([]);
            }}
            className="shrink-0 rounded-lg px-2 py-1 text-xs font-medium underline"
          >
            trocar
          </button>
          <input type="hidden" name="estudante_id" value={escolhido.id} />
        </div>
      ) : (
        <div className="flex flex-col gap-2">
          <Campo
            rotulo="Estudante"
            value={termo}
            onChange={(e) => aoDigitar(e.target.value)}
            placeholder="Nome ou matricula"
            autoComplete="off"
            dica="Digite ao menos 2 caracteres e escolha na lista."
          />

          {buscando ? (
            <p className="text-xs text-[var(--color-text-muted)]">buscando...</p>
          ) : null}

          {!buscando && termo.trim().length >= 2 && resultados.length === 0 ? (
            <p className="text-xs text-[var(--color-text-muted)]">
              Nenhum estudante encontrado.
            </p>
          ) : null}

          {resultados.length > 0 ? (
            <ul className="flex max-h-64 flex-col gap-1 overflow-y-auto">
              {resultados.map((estudante) => (
                <li key={estudante.id}>
                  <button
                    type="button"
                    onClick={() => setEscolhido(estudante)}
                    className="w-full rounded-xl bg-[var(--color-canvas)] px-3 py-2 text-left"
                  >
                    <span className="block text-sm">{estudante.nome}</span>
                    <span className="block text-xs text-[var(--color-text-muted)]">
                      {estudante.turma ?? "sem turma"} · matricula{" "}
                      {estudante.matricula}
                    </span>
                  </button>
                </li>
              ))}
            </ul>
          ) : null}
        </div>
      )}

      <Botao
        type="submit"
        disabled={enviando || (tipoDestino === "estudante" && !escolhido)}
      >
        {enviando ? "Enviando..." : "Enviar aviso"}
      </Botao>
    </form>
  );
}
