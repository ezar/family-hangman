/**
 * Resolucion de credenciales de Redis, aislada y sin dependencias para poder
 * probarla sola.
 *
 * La integracion de Upstash en Vercel no siempre crea las variables con el
 * mismo nombre: segun como se instale deja `UPSTASH_REDIS_REST_*` o el juego
 * `KV_REST_API_*` (heredado de Vercel KV). Aceptamos ambos para que el
 * proyecto no dependa de como se conectara la base de datos.
 */

export interface RedisCredentials {
  url: string;
  token: string;
  /** Nombre de la variable de la que salio, util en los mensajes de error. */
  source: string;
}

/**
 * Pares validos, en orden de preferencia. `KV_REST_API_READ_ONLY_TOKEN` queda
 * fuera a proposito: no puede escribir, y el juego escribe en cada letra.
 */
const CANDIDATES = [
  { url: 'UPSTASH_REDIS_REST_URL', token: 'UPSTASH_REDIS_REST_TOKEN' },
  { url: 'KV_REST_API_URL', token: 'KV_REST_API_TOKEN' },
] as const;

export function resolveRedisCredentials(
  env: Record<string, string | undefined>,
): RedisCredentials | null {
  for (const candidate of CANDIDATES) {
    const url = env[candidate.url]?.trim();
    const token = env[candidate.token]?.trim();
    if (url && token) {
      return { url, token, source: candidate.url };
    }
  }
  return null;
}

export function missingCredentialsMessage(): string {
  const pairs = CANDIDATES.map((c) => `${c.url} + ${c.token}`).join(', o bien ');
  return (
    `Faltan las credenciales de Redis. Se necesita ${pairs}. ` +
    'Anade la integracion de Upstash Redis en Vercel (y marca los tres entornos) ' +
    'o copia .env.example a .env.local.'
  );
}
