"use client";

import { Botao, Tela } from "@/components/ui";

/**
 * Rede de seguranca das paginas renderizadas no servidor.
 *
 * Sem isto, uma falha de banco no /portal ou no /admin aparece como
 * "An error occurred in the Server Components render but no message was
 * provided" -- que nao diz nada nem para a familia nem para a escola. Em
 * producao o Next apaga a mensagem original de proposito, para nao vazar
 * detalhe de infraestrutura; o `digest` e' a chave para achar o erro
 * completo no log do servidor.
 */
export default function Erro({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <Tela
      titulo="Nao foi possivel carregar"
      descricao="O problema esta do nosso lado, nao com o seu acesso."
    >
      <div className="flex flex-col gap-4">
        <p className="text-sm text-[var(--color-text-muted)]">
          Tente de novo em alguns minutos. Se continuar assim, avise a
          secretaria da escola.
        </p>

        <Botao type="button" onClick={reset}>
          Tentar de novo
        </Botao>

        <a
          href="/login"
          className="text-center text-sm font-medium text-[var(--color-primary)] underline"
        >
          Voltar para o login
        </a>

        {error.digest ? (
          <p className="text-center text-xs text-[var(--color-text-muted)]">
            Codigo do erro: {error.digest}
          </p>
        ) : null}
      </div>
    </Tela>
  );
}
