import { redirect } from "next/navigation";
import { Tela } from "@/components/ui";
import { carregarSessaoResponsavel } from "@/lib/auth";
import { FormularioTroca } from "./formulario";

export const dynamic = "force-dynamic";

export default async function PaginaTrocarSenha() {
  // Nao usa exigirResponsavel(): esta e' justamente a tela para onde aquele
  // guarda redireciona quando a senha ainda precisa ser trocada.
  const sessao = await carregarSessaoResponsavel();
  if (!sessao) redirect("/login");

  return (
    <Tela titulo="Trocar senha" descricao={sessao.estudante.nome}>
      <FormularioTroca primeiroAcesso={sessao.precisaTrocarSenha} />
    </Tela>
  );
}
