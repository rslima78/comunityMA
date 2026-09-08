"use client";

import { useActionState } from "react";
import { Alerta, Botao, Campo } from "@/components/ui";
import { trocarSenha, type EstadoTroca } from "./actions";

export function FormularioTroca({
  usandoSenhaInicial,
}: {
  usandoSenhaInicial: boolean;
}) {
  const [estado, acao, enviando] = useActionState<EstadoTroca, FormData>(
    trocarSenha,
    {}
  );

  return (
    <form action={acao} className="flex flex-col gap-4">
      {usandoSenhaInicial ? (
        <Alerta tipo="aviso">
          Sua senha ainda é a data de nascimento do estudante, que outras
          pessoas podem saber. Escolher uma senha própria deixa os dados dele
          mais protegidos.
        </Alerta>
      ) : null}

      {estado.erro ? <Alerta>{estado.erro}</Alerta> : null}

      <Campo
        rotulo="Senha atual"
        name="senha_atual"
        type="password"
        autoComplete="current-password"
        required
        autoFocus
        dica={
          usandoSenhaInicial
            ? "E a data de nascimento do estudante: DDMMAAAA."
            : undefined
        }
      />

      <Campo
        rotulo="Nova senha"
        name="nova_senha"
        type="password"
        autoComplete="new-password"
        required
        dica="Pelo menos 6 caracteres, e que nao seja apenas uma data."
      />

      <Campo
        rotulo="Repita a nova senha"
        name="confirmacao"
        type="password"
        autoComplete="new-password"
        required
      />

      <Botao type="submit" disabled={enviando}>
        {enviando ? "Salvando..." : "Salvar nova senha"}
      </Botao>
    </form>
  );
}
