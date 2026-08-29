import { Redis } from '@upstash/redis';
import { missingCredentialsMessage, resolveRedisCredentials } from './redisEnv';
import type { Game } from './types';

/** Las salas caducan solas: nadie vuelve a una partida de hace medio dia. */
const ROOM_TTL_SECONDS = 12 * 60 * 60;

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
  const raw = await getRedis().get<Game | string>(gameKey(roomCode));
  if (!raw) return null;
  // Upstash deserializa JSON automaticamente, pero aceptamos tambien string.
  return typeof raw === 'string' ? (JSON.parse(raw) as Game) : raw;
}

export async function writeGame(game: Game): Promise<void> {
  await getRedis().set(gameKey(game.roomCode), JSON.stringify(game), {
    ex: ROOM_TTL_SECONDS,
  });
}

/** Escribe solo si la sala no existe ya, para no pisar una partida en curso. */
export async function createGameIfAbsent(game: Game): Promise<boolean> {
  const result = await getRedis().set(gameKey(game.roomCode), JSON.stringify(game), {
    ex: ROOM_TTL_SECONDS,
    nx: true,
  });
  return result === 'OK';
}
