import { Redis } from '@upstash/redis';
import { normalizeGame } from './gameLogic';
import { missingCredentialsMessage, resolveRedisCredentials } from './redisEnv';
import type { AttemptResult, Challenge } from './challenge';
import type { Game } from './types';

/** Las salas caducan solas: nadie vuelve a una partida de hace medio dia. */
const ROOM_TTL_SECONDS = 12 * 60 * 60;
/** Un reto circula por chats: tiene que aguantar bastante mas que una sala. */
const CHALLENGE_TTL_SECONDS = 7 * 24 * 60 * 60;
/** Una partida a medias de un reto: lo justo para terminarla con calma. */
const ATTEMPT_TTL_SECONDS = 24 * 60 * 60;
/** Tope de resultados que se guardan y se muestran por reto. */
export const MAX_RESULTS = 50;

let client: Redis | null = null;

export function getRedis(): Redis {
  if (client) return client;

  const credentials = resolveRedisCredentials(process.env);
  if (!credentials) {
    throw new Error(missingCredentialsMessage());
  }

  client = new Redis({ url: credentials.url, token: credentials.token });
  return client;
}

export function gameKey(roomCode: string): string {
  return `game:${roomCode}`;
}

export async function readGame(roomCode: string): Promise<Game | null> {
  const raw = parse<Game>(await getRedis().get<Game | string>(gameKey(roomCode)));
  // Puede venir de una version anterior del juego: se completa al leerla.
  return raw ? normalizeGame(raw) : null;
}

export async function writeGame(game: Game): Promise<void> {
  await getRedis().set(gameKey(game.roomCode), JSON.stringify(game), {
    ex: ROOM_TTL_SECONDS,
  });
}

function parse<T>(raw: T | string | null): T | null {
  if (!raw) return null;
  // Upstash deserializa JSON automaticamente, pero aceptamos tambien string.
  return typeof raw === 'string' ? (JSON.parse(raw) as T) : raw;
}

// --- Retos por enlace -------------------------------------------------------

export function challengeKey(code: string): string {
  return `challenge:${code}`;
}

export function resultsKey(code: string): string {
  return `challenge:${code}:results`;
}

export function attemptKey(id: string): string {
  return `attempt:${id}`;
}

/** El reto no se modifica nunca despues de crearse; solo crece su lista aparte. */
export async function createChallengeIfAbsent(challenge: Challenge): Promise<boolean> {
  const result = await getRedis().set(challengeKey(challenge.code), JSON.stringify(challenge), {
    ex: CHALLENGE_TTL_SECONDS,
    nx: true,
  });
  return result === 'OK';
}

export async function readChallenge(code: string): Promise<Challenge | null> {
  return parse<Challenge>(await getRedis().get<Challenge | string>(challengeKey(code)));
}

/**
 * Los resultados van a una lista de Redis en vez de a un campo del reto: el
 * LPUSH es atomico, asi que dos personas terminando a la vez no se pisan.
 */
export async function pushResult(code: string, result: AttemptResult): Promise<void> {
  const redis = getRedis();
  const key = resultsKey(code);
  await redis.lpush(key, JSON.stringify(result));
  await redis.ltrim(key, 0, MAX_RESULTS - 1);
  await redis.expire(key, CHALLENGE_TTL_SECONDS);
}

export async function readResults(code: string): Promise<AttemptResult[]> {
  const raw = await getRedis().lrange<AttemptResult | string>(resultsKey(code), 0, MAX_RESULTS - 1);
  return (raw ?? [])
    .map((entry) => parse<AttemptResult>(entry))
    .filter((entry): entry is AttemptResult => entry !== null);
}

export async function readAttempt(id: string): Promise<Game | null> {
  const raw = parse<Game>(await getRedis().get<Game | string>(attemptKey(id)));
  return raw ? normalizeGame(raw) : null;
}

export async function writeAttempt(id: string, game: Game): Promise<void> {
  await getRedis().set(attemptKey(id), JSON.stringify(game), { ex: ATTEMPT_TTL_SECONDS });
}

/** Escribe solo si la sala no existe ya, para no pisar una partida en curso. */
export async function createGameIfAbsent(game: Game): Promise<boolean> {
  const result = await getRedis().set(gameKey(game.roomCode), JSON.stringify(game), {
    ex: ROOM_TTL_SECONDS,
    nx: true,
  });
  return result === 'OK';
}
