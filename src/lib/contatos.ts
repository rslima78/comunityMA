/**
 * Contatos da escola, mostrados no portal como links de conversa no WhatsApp.
 *
 * O telefone fica em digitos, no formato internacional que o wa.me exige:
 * 55 + DDD + numero. Celular brasileiro tem nove digitos desde 2016, entao os
 * numeros de oito digitos que a escola passou receberam o 9 inicial.
 */
export interface ContatoDaEscola {
  cargo: string;
  nome?: string;
  /** so' digitos: 55 + DDD + numero */
  telefone: string;
}

export const CONTATOS: ContatoDaEscola[] = [
  { cargo: "Secretaria", telefone: "5571999912425" },
  { cargo: "Diretor Geral", nome: "Cláudio", telefone: "5571996653114" },
  { cargo: "Vice-Diretor", nome: "Robson", telefone: "5571996898317" },
  { cargo: "Vice-Diretor", nome: "Erivaldo", telefone: "5571983213380" },
];

/** "5571996898317" -> "(71) 99689-8317" */
export function exibirTelefone(telefone: string): string {
  const nacional = telefone.replace(/^55/, "");
  const ddd = nacional.slice(0, 2);
  const numero = nacional.slice(2);
  const meio = numero.length === 9 ? 5 : 4;
  return `(${ddd}) ${numero.slice(0, meio)}-${numero.slice(meio)}`;
}

/**
 * Link de conversa ja' com uma apresentacao escrita.
 *
 * Sem isso a escola recebe um "oi" solto e precisa perguntar de quem se
 * trata; com o nome e a turma do estudante, quem atende ja' sabe puxar o
 * cadastro.
 */
export function linkDoWhatsapp(
  telefone: string,
  estudante: { nome: string; turma: string | null }
): string {
  const turma = estudante.turma ? ` da turma ${estudante.turma}` : "";
  const mensagem = `Olá! Sou responsável pelo estudante ${estudante.nome}${turma}.`;
  return `https://wa.me/${telefone}?text=${encodeURIComponent(mensagem)}`;
}
