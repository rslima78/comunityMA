import { redirect } from "next/navigation";
import { Tela } from "@/components/ui";
import { carregarSessaoResponsavel } from "@/lib/auth";
import { FormularioLogin } from "./formulario";

export const dynamic = "force-dynamic";

export default async function PaginaLogin() {
  // Quem ja' esta' autenticado nao precisa ver o formulario de novo.
  const sessao = await carregarSessaoResponsavel();
  if (sessao) redirect(sessao.precisaTrocarSenha ? "/trocar-senha" : "/portal");

  return (
    <Tela
      titulo="Portal do Responsavel"
      descricao="Acompanhe notas, faltas, ocorrencias e avisos."
    >
      <FormularioLogin />
    </Tela>
  );
}
