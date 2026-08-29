import type { Game } from './types';

/**
 * Un reto es una palabra que alguien escribe y reparte por enlace. A
 * diferencia de una sala, no hay que esperar a nadie: quien abre el enlace
 * juega al momento, y pueden jugarlo muchas personas por separado.
 */
export interface Challenge {
  code: string;
  word: string;
  authorName: string;
  createdAt: number;
}

/** Lo que deja cada persona que lo intenta, para la tabla del autor. */
export interface AttemptResult {
  name: string;
  status: 'won' | 'lost';
  wrongCount: number;
  maxWrong: number;
  /** Letras probadas: distingue al que acierta a la primera del que rasca. */
  tries: number;
  at: number;
}

/** Una linea de la lista "mis retos": lo justo para decidir cual abrir. */
export interface ChallengeSummary {
  code: string;
  wordLength: number;
  /** Cuantas personas lo han intentado y cuantas lo sacaron. */
  tried: number;
  solved: number;
  createdAt: number;
}

/** Cuantos retos propios se recuerdan y se pueden consultar de una vez. */
export const MAX_OWN_CHALLENGES = 20;

export function summarizeChallenge(
  challenge: Challenge,
  results: AttemptResult[],
): ChallengeSummary {
  return {
    code: challenge.code,
    wordLength: challenge.word.length,
    tried: results.length,
    solved: results.filter((result) => result.status === 'won').length,
    createdAt: challenge.createdAt,
  };
}

/**
 * Intentos que han entrado en tus retos desde la ultima vez que los miraste.
 * Es lo que de verdad hace volver: no cuantas partidas llevas, sino que
 * alguien acaba de picar.
 */
export function newAttempts(
  challenges: ChallengeSummary[],
  seen: Record<string, number>,
): number {
  return challenges.reduce(
    (total, challenge) => total + Math.max(0, challenge.tried - (seen[challenge.code] ?? 0)),
    0,
  );
}

/** Los codigos que llegan por la URL: separados por comas y acotados. */
export function parseCodes(input: unknown): string[] {
  if (typeof input !== 'string') return [];
  const codes = input
    .split(',')
    .map((code) => normalizeChallengeCode(code))
    .filter((code): code is string => code !== null);
  return [...new Set(codes)].slice(0, MAX_OWN_CHALLENGES);
}

/** El reto tal como lo ve quien lo abre: nunca incluye la palabra. */
export interface PublicChallenge {
  code: string;
  authorName: string;
  wordLength: number;
  results: AttemptResult[];
}

/**
 * Un reto no tiene nivel: la palabra la elige una persona, no una lista. Usa
 * las mismas vidas que el nivel familiar, y un test vigila que no se separen.
 * Se declara aqui como literal para que este modulo no dependa de nada en
 * tiempo de ejecucion y se pueda cargar tal cual desde los tests.
 */
export const CHALLENGE_LIVES = 6;

/**
 * Codigo de seis caracteres: un reto circula por chats y dura dias, asi que
 * conviene que choque menos que el de una sala.
 */
export function generateChallengeCode(): string {
  const alphabet = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  let code = '';
  for (let i = 0; i < 6; i += 1) {
    code += alphabet[Math.floor(Math.random() * alphabet.length)];
  }
  return code;
}

export function normalizeChallengeCode(input: unknown): string | null {
  if (typeof input !== 'string') return null;
  const code = input.trim().toUpperCase();
  return /^[A-Z0-9]{4,10}$/.test(code) ? code : null;
}

export function normalizeAttemptId(input: unknown): string | null {
  if (typeof input !== 'string') return null;
  const id = input.trim();
  return /^[A-Za-z0-9_-]{6,64}$/.test(id) ? id : null;
}

export function newAttemptId(): string {
  return `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 10)}`;
}

/** La partida de quien acepta el reto: un solo jugador, la palabra del autor. */
export function attemptGame(challenge: Challenge, playerName: string): Game {
  return {
    roomCode: challenge.code,
    language: 'es',
    difficulty: 'familiar',
    status: 'playing',
    word: challenge.word,
    guessed: [],
    wrongCount: 0,
    maxWrong: CHALLENGE_LIVES,
    turnIndex: 0,
    players: [{ id: 1, name: playerName }],
    nextId: 2,
    wordSource: 'player',
    setterId: null,
    hintsUsed: 0,
    scores: { wins: 0, losses: 0, streak: 0 },
  };
}

export function summarize(game: Game, name: string): AttemptResult | null {
  if (game.status !== 'won' && game.status !== 'lost') return null;
  return {
    name,
    status: game.status,
    wrongCount: game.wrongCount,
    maxWrong: game.maxWrong,
    tries: game.guessed.length,
    at: Date.now(),
  };
}

/**
 * Orden de la tabla: primero quien gano, y entre los que ganaron, quien menos
 * se equivoco y con menos letras.
 */
export function rankResults(results: AttemptResult[]): AttemptResult[] {
  return [...results].sort((a, b) => {
    if (a.status !== b.status) return a.status === 'won' ? -1 : 1;
    if (a.wrongCount !== b.wrongCount) return a.wrongCount - b.wrongCount;
    return a.tries - b.tries;
  });
}
