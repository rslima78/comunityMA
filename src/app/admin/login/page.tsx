import { redirect } from "next/navigation";
import { Tela } from "@/components/ui";
import { carregarSessaoAdmin } from "@/lib/auth";
import { FormularioLoginAdmin } from "./formulario";

export const dynamic = "force-dynamic";

export default async function PaginaLoginAdmin() {
  if (await carregarSessaoAdmin()) redirect("/admin");

  return (
    <Tela titulo="Administracao" descricao="Acesso restrito a equipe da escola.">
      <FormularioLoginAdmin />
    </Tela>
  );
}
