"use client";

import { useActionState } from "react";
import { Alerta, Botao, Campo } from "@/components/ui";
import { entrar, type EstadoLogin } from "./actions";

export function FormularioLogin() {
  const [estado, acao, enviando] = useActionState<EstadoLogin, FormData>(
    entrar,
    {}
  );

  return (
    <form action={acao} className="flex flex-col gap-4">
      {estado.erro ? <Alerta>{estado.erro}</Alerta> : null}

      <Campo
        rotulo="CPF do estudante"
        name="cpf"
        inputMode="numeric"
        autoComplete="username"
        placeholder="000.000.000-00"
        maxLength={14}
        required
        autoFocus
      />

      <Campo
        rotulo="Senha"
        name="senha"
        type="password"
        autoComplete="current-password"
        required
        dica="No primeiro acesso, use a data de nascimento do estudante: DDMMAAAA."
      />

      <Botao type="submit" disabled={enviando}>
        {enviando ? "Entrando..." : "Entrar"}
      </Botao>
    </form>
  );
}
