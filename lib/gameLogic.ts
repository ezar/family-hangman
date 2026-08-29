import type { Game, Player, PublicGame } from './types';

/**
 * Fallos permitidos antes de perder. Vive aqui, junto a la logica que lo usa,
 * para que este modulo no dependa de nada en tiempo de ejecucion: asi se puede
 * cargar tal cual desde los tests y desde el navegador.
 */
export const MAX_WRONG = 6;

const ALPHABET = 'abcdefghijklmnopqrstuvwxyz';

export const LETTERS = ALPHABET.split('');

/** Genera un codigo de sala corto, legible y sin caracteres ambiguos (0/O, 1/I). */
export function generateRoomCode(length = 4): string {
  const alphabet = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  let code = '';
  for (let i = 0; i < length; i += 1) {
    code += alphabet[Math.floor(Math.random() * alphabet.length)];
  }
  return code;
}

export function normalizeLetter(input: unknown): string | null {
  if (typeof input !== 'string') return null;
  const letter = input.trim().toLowerCase();
  return letter.length === 1 && ALPHABET.includes(letter) ? letter : null;
}

export function normalizeRoomCode(input: unknown): string | null {
  if (typeof input !== 'string') return null;
  const code = input.trim().toUpperCase();
  return /^[A-Z0-9]{3,8}$/.test(code) ? code : null;
}

/** Letras unicas de la palabra, en el orden en el que aparecen. */
export function wordLetters(word: string): string[] {
  return Array.from(new Set(word.split('')));
}

export function isWordComplete(word: string, guessed: string[]): boolean {
  return wordLetters(word).every((letter) => guessed.includes(letter));
}

/** La palabra tal como se muestra: letras acertadas o null por hueco. */
export function maskedWord(word: string, guessed: string[]): (string | null)[] {
  return word.split('').map((letter) => (guessed.includes(letter) ? letter : null));
}

export function remainingLives(wrongCount: number): number {
  return Math.max(0, MAX_WRONG - wrongCount);
}

export function currentPlayer(game: Pick<Game, 'players' | 'turnIndex'>): Player | null {
  if (game.players.length === 0) return null;
  return game.players[game.turnIndex % game.players.length] ?? null;
}

export type GuessError =
  | 'not-playing'
  | 'not-your-turn'
  | 'invalid-letter'
  | 'already-guessed'
  | 'unknown-player';

export type GuessResult =
  | { ok: true; game: Game; correct: boolean; letter: string }
  | { ok: false; error: GuessError };

/**
 * Aplica una letra a la partida. Funcion pura: devuelve una partida nueva,
 * nunca muta la que recibe. La usan por igual la API route del modo grupal
 * y el modo solo en el navegador.
 */
export function applyGuess(game: Game, playerId: number, rawLetter: string): GuessResult {
  if (game.status !== 'playing') {
    return { ok: false, error: 'not-playing' };
  }

  const active = currentPlayer(game);
  if (!active) {
    return { ok: false, error: 'unknown-player' };
  }
  if (!game.players.some((player) => player.id === playerId)) {
    return { ok: false, error: 'unknown-player' };
  }
  if (active.id !== playerId) {
    return { ok: false, error: 'not-your-turn' };
  }

  const letter = normalizeLetter(rawLetter);
  if (!letter) {
    return { ok: false, error: 'invalid-letter' };
  }
  if (game.guessed.includes(letter)) {
    return { ok: false, error: 'already-guessed' };
  }

  const correct = game.word.includes(letter);
  const guessed = [...game.guessed, letter];
  const wrongCount = correct ? game.wrongCount : game.wrongCount + 1;

  let status: Game['status'] = 'playing';
  if (isWordComplete(game.word, guessed)) {
    status = 'won';
  } else if (wrongCount >= MAX_WRONG) {
    status = 'lost';
  }

  // El turno pasa siempre al siguiente jugador, acierte o falle.
  const turnIndex =
    status === 'playing' && game.players.length > 0
      ? (game.turnIndex + 1) % game.players.length
      : game.turnIndex;

  return {
    ok: true,
    correct,
    letter,
    game: { ...game, guessed, wrongCount, status, turnIndex },
  };
}

/** Anade un jugador. Al llegar el segundo, la partida arranca. */
export function addPlayer(game: Game, name: string): { game: Game; player: Player } {
  const player: Player = { id: game.nextId, name };
  const players = [...game.players, player];
  const status: Game['status'] =
    game.status === 'waiting' && players.length >= 2 ? 'playing' : game.status;

  return {
    player,
    game: { ...game, players, nextId: game.nextId + 1, status },
  };
}

/** Reinicia la partida con una palabra nueva, manteniendo jugadores e idioma. */
export function restartGame(game: Game, word: string): Game {
  return {
    ...game,
    word,
    guessed: [],
    wrongCount: 0,
    turnIndex: 0,
    status: game.players.length >= 2 ? 'playing' : 'waiting',
  };
}

export function createGame(params: {
  roomCode: string;
  language: Game['language'];
  difficulty: Game['difficulty'];
  word: string;
  hostName: string;
}): Game {
  return {
    roomCode: params.roomCode,
    language: params.language,
    difficulty: params.difficulty,
    status: 'waiting',
    word: params.word,
    guessed: [],
    wrongCount: 0,
    turnIndex: 0,
    players: [{ id: 1, name: params.hostName }],
    nextId: 2,
  };
}

/**
 * Oculta la palabra mientras la partida sigue viva. El cliente recibe la
 * mascara ya calculada (letras acertadas y huecos) y la longitud, que es
 * todo lo que necesita para pintar el tablero sin conocer la respuesta.
 */
export function toPublicGame(game: Game): PublicGame {
  const revealed = game.status === 'won' || game.status === 'lost';
  const { word, ...rest } = game;
  return {
    ...rest,
    word: revealed ? word : null,
    masked: maskedWord(word, game.guessed),
    wordLength: word.length,
  };
}
