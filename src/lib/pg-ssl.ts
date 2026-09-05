/**
 * Decide se a conexao Postgres usa SSL, a partir da propria DATABASE_URL.
 *
 * Nao usam SSL:
 *   - Postgres local do docker-compose (localhost / 127.0.0.1)
 *   - rede privada do Railway (*.railway.internal), que ja e' isolada
 *   - qualquer URL com sslmode=disable explicito
 *
 * Usam SSL sem verificar o certificado:
 *   - proxy publico do Railway (*.proxy.rlwy.net) e demais hosts remotos,
 *     que apresentam certificado auto-assinado.
 */
export function sslParaConexao(connectionString: string) {
  const semSsl =
    /[?&]sslmode=disable/.test(connectionString) ||
    /@(localhost|127\.0\.0\.1|\[::1\]|[^@/:]*\.railway\.internal)(:|\/)/.test(
      connectionString
    );

  return semSsl ? undefined : { rejectUnauthorized: false };
}

export function descreveDestino(connectionString: string) {
  const host = connectionString.match(/@([^/:?]+)/)?.[1] ?? "desconhecido";
  return host;
}
