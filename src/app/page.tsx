import { redirect } from "next/navigation";

/**
 * A raiz nao mostra nada por conta propria: manda para o login, que por sua
 * vez encaminha quem ja' tem sessao. A pagina de diagnostico da Etapa 1 saiu
 * daqui -- ela listava as tabelas do banco em uma URL publica.
 */
export default function Home() {
  redirect("/login");
}
