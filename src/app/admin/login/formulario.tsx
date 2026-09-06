"use client";

import { useActionState } from "react";
import { Alerta, Botao, Campo } from "@/components/ui";
import { entrarAdmin, type EstadoLoginAdmin } from "./actions";

export function FormularioLoginAdmin() {
  const [estado, acao, enviando] = useActionState<EstadoLoginAdmin, FormData>(
    entrarAdmin,
    {}
  );

  return (
    <form action={acao} className="flex flex-col gap-4">
      {estado.erro ? <Alerta>{estado.erro}</Alerta> : null}

      <Campo
        rotulo="Usuario"
        name="usuario"
        autoComplete="username"
        required
        autoFocus
      />

      <Campo
        rotulo="Senha"
        name="senha"
        type="password"
        autoComplete="current-password"
        required
      />

      <Botao type="submit" disabled={enviando}>
        {enviando ? "Entrando..." : "Entrar"}
      </Botao>
    </form>
  );
}
