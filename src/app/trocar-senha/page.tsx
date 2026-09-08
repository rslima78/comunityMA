import { redirect } from "next/navigation";
import { Tela } from "@/components/ui";
import { carregarSessaoResponsavel } from "@/lib/auth";
import { FormularioTroca } from "./formulario";

export const dynamic = "force-dynamic";

export default async function PaginaTrocarSenha() {
  const sessao = await carregarSessaoResponsavel();
  if (!sessao) redirect("/login");

  return (
    <Tela titulo="Trocar senha" descricao={sessao.estudante.nome}>
      <FormularioTroca usandoSenhaInicial={sessao.usandoSenhaInicial} />
      <a
        href="/portal"
        className="mt-4 block text-center text-sm font-medium text-[var(--color-primary)] underline"
      >
        Voltar sem trocar
      </a>
    </Tela>
  );
}
