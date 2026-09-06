/**
 * Limite de tentativas de login, em memoria.
 *
 * Segura ataque de forca bruta contra CPF + data de nascimento, que sao dados
 * que circulam. Como e' em memoria, zera a cada deploy e nao e' compartilhado
 * entre instancias -- suficiente para uma escola com um servidor so'. Se um
 * dia o Railway rodar mais de uma replica, isso precisa virar tabela ou Redis.
 */

const JANELA_MS = 15 * 60 * 1000;
const MAX_TENTATIVAS = 8;

const tentativas = new Map<string, number[]>();

export interface ResultadoLimite {
  liberado: boolean;
  esperarSegundos: number;
}

export function registrarTentativa(chave: string): ResultadoLimite {
  const agora = Date.now();
  const recentes = (tentativas.get(chave) ?? []).filter(
    (t) => agora - t < JANELA_MS
  );

  if (recentes.length >= MAX_TENTATIVAS) {
    const maisAntiga = recentes[0];
    tentativas.set(chave, recentes);
    return {
      liberado: false,
      esperarSegundos: Math.ceil((JANELA_MS - (agora - maisAntiga)) / 1000),
    };
  }

  recentes.push(agora);
  tentativas.set(chave, recentes);

  // Faxina preguicosa: sem isso o Map cresceria para sempre.
  if (tentativas.size > 5000) {
    for (const [k, v] of tentativas) {
      if (v.every((t) => agora - t >= JANELA_MS)) tentativas.delete(k);
    }
  }

  return { liberado: true, esperarSegundos: 0 };
}

/** Chamado apos um login bem-sucedido, para nao punir quem so' errou antes. */
export function limparTentativas(chave: string) {
  tentativas.delete(chave);
}
