import type { Difficulty, Game, Player, PublicGame, Scores, WordSource } from './types';

/**
 * Fallos permitidos por nivel. Los peques necesitan mas margen que un adulto
 * peleandose con "paralelepipedo".
 */
export const LIVES_BY_DIFFICULTY: Record<Difficulty, number> = {
  infantil: 8,
  familiar: 6,
  experto: 5,
};

/** El dibujo tiene seis piezas; con otras vidas se reparten proporcionalmente. */
export const HANGMAN_PARTS = 6;

/** Comodines por ronda. */
export const MAX_HINTS = 1;

const ALPHABET = 'abcdefghijklmnopqrstuvwxyz';

export const LETTERS = ALPHABET.split('');

const EMPTY_SCORES: Scores = { wins: 0, losses: 0, streak: 0 };

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

export const MIN_CUSTOM_WORD = 3;
export const MAX_CUSTOM_WORD = 20;

/**
 * Limpia la palabra que escribe un jugador para que encaje con el teclado de
 * 26 letras: minusculas, sin tildes y con la eñe convertida en n.
 */
export function normalizeCustomWord(input: unknown): string | null {
  if (typeof input !== 'string') return null;
  const word = input
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/\u00f1/g, 'n')
    .toLowerCase()
    .trim();
  if (!/^[a-z]+$/.test(word)) return null;
  if (word.length < MIN_CUSTOM_WORD || word.length > MAX_CUSTOM_WORD) return null;
  return word;
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

export function remainingLives(game: Pick<Game, 'wrongCount' | 'maxWrong'>): number {
  return Math.max(0, game.maxWrong - game.wrongCount);
}

/**
 * Piezas del dibujo que toca mostrar. Con seis vidas es uno a uno; con mas o
 * menos se reparten para que la ultima pieza coincida con la ultima vida.
 */
export function partsToDraw(wrongCount: number, maxWrong: number): number {
  if (wrongCount >= maxWrong) return HANGMAN_PARTS;
  return Math.min(HANGMAN_PARTS, Math.round((wrongCount / maxWrong) * HANGMAN_PARTS));
}

/** Los que adivinan: todos menos quien puso la palabra. */
export function guessers(game: Pick<Game, 'players' | 'setterId'>): Player[] {
  return game.players.filter((player) => player.id !== game.setterId);
}

export function currentPlayer(game: Pick<Game, 'players' | 'setterId' | 'turnIndex'>): Player | null {
  const list = guessers(game);
  if (list.length === 0) return null;
  return list[game.turnIndex % list.length] ?? null;
}

/** Una sala arranca cuando hay al menos dos personas y alguien que adivine. */
export function canStart(game: Pick<Game, 'players' | 'setterId'>): boolean {
  return game.players.length >= 2 && guessers(game).length >= 1;
}

function nextScores(scores: Scores, status: Game['status']): Scores {
  if (status === 'won') {
    return { wins: scores.wins + 1, losses: scores.losses, streak: scores.streak + 1 };
  }
  if (status === 'lost') {
    return { wins: scores.wins, losses: scores.losses + 1, streak: 0 };
  }
  return scores;
}

/** Cierra el intento: recalcula estado, marcador y turno de una sola vez. */
function resolveAttempt(game: Game, guessed: string[], wrongCount: number): Game {
  let status: Game['status'] = 'playing';
  if (isWordComplete(game.word, guessed)) {
    status = 'won';
  } else if (wrongCount >= game.maxWrong) {
    status = 'lost';
  }

  const list = guessers(game);
  const turnIndex =
    status === 'playing' && list.length > 0 ? (game.turnIndex + 1) % list.length : game.turnIndex;

  return {
    ...game,
    guessed,
    wrongCount,
    status,
    turnIndex,
    scores: nextScores(game.scores, status),
  };
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
 * Aplica una letra. Funcion pura: devuelve una partida nueva, nunca muta la
 * que recibe. La usan por igual la API del modo grupal y el modo solo.
 */
export function applyGuess(game: Game, playerId: number, rawLetter: string): GuessResult {
  if (game.status !== 'playing') return { ok: false, error: 'not-playing' };

  if (!game.players.some((player) => player.id === playerId)) {
    return { ok: false, error: 'unknown-player' };
  }

  const active = currentPlayer(game);
  if (!active) return { ok: false, error: 'unknown-player' };
  if (active.id !== playerId) return { ok: false, error: 'not-your-turn' };

  const letter = normalizeLetter(rawLetter);
  if (!letter) return { ok: false, error: 'invalid-letter' };
  if (game.guessed.includes(letter)) return { ok: false, error: 'already-guessed' };

  const correct = game.word.includes(letter);

  return {
    ok: true,
    correct,
    letter,
    game: resolveAttempt(
      game,
      [...game.guessed, letter],
      correct ? game.wrongCount : game.wrongCount + 1,
    ),
  };
}

export type HintError = GuessError | 'no-hints-left' | 'last-life' | 'nothing-to-reveal';

export type HintResult =
  | { ok: true; game: Game; letter: string }
  | { ok: false; error: HintError };

/**
 * Comodin: revela una letra a cambio de una vida y pasa el turno, como
 * cualquier otro intento. No se puede gastar con una sola vida, para que la
 * ayuda no sea justo lo que acabe con la partida.
 */
export function applyHint(
  game: Game,
  playerId: number,
  choose: (options: string[]) => string = (options) =>
    options[Math.floor(Math.random() * options.length)],
): HintResult {
  if (game.status !== 'playing') return { ok: false, error: 'not-playing' };

  if (!game.players.some((player) => player.id === playerId)) {
    return { ok: false, error: 'unknown-player' };
  }

  const active = currentPlayer(game);
  if (!active) return { ok: false, error: 'unknown-player' };
  if (active.id !== playerId) return { ok: false, error: 'not-your-turn' };

  if (game.hintsUsed >= MAX_HINTS) return { ok: false, error: 'no-hints-left' };
  if (remainingLives(game) <= 1) return { ok: false, error: 'last-life' };

  const pending = wordLetters(game.word).filter((letter) => !game.guessed.includes(letter));
  if (pending.length === 0) return { ok: false, error: 'nothing-to-reveal' };

  const letter = choose(pending);
  const revealed = resolveAttempt(game, [...game.guessed, letter], game.wrongCount + 1);

  return { ok: true, letter, game: { ...revealed, hintsUsed: game.hintsUsed + 1 } };
}

/** Anade un jugador. Al haber gente suficiente, la partida arranca sola. */
export function addPlayer(game: Game, name: string): { game: Game; player: Player } {
  const player: Player = { id: game.nextId, name };
  const players = [...game.players, player];
  const next = { ...game, players, nextId: game.nextId + 1 };
  const status: Game['status'] =
    game.status === 'waiting' && canStart(next) ? 'playing' : game.status;

  return { player, game: { ...next, status } };
}

/** Nueva ronda: palabra limpia, marcador intacto. */
export function restartGame(game: Game, word: string): Game {
  return {
    ...game,
    word,
    guessed: [],
    wrongCount: 0,
    turnIndex: 0,
    hintsUsed: 0,
    status: canStart(game) ? 'playing' : 'waiting',
  };
}

export function createGame(params: {
  roomCode: string;
  language: Game['language'];
  difficulty: Difficulty;
  word: string;
  hostName: string;
  wordSource?: WordSource;
}): Game {
  const wordSource = params.wordSource ?? 'list';
  return {
    roomCode: params.roomCode,
    language: params.language,
    difficulty: params.difficulty,
    status: 'waiting',
    word: params.word,
    guessed: [],
    wrongCount: 0,
    maxWrong: LIVES_BY_DIFFICULTY[params.difficulty],
    turnIndex: 0,
    players: [{ id: 1, name: params.hostName }],
    nextId: 2,
    wordSource,
    // Quien crea una sala de palabra propia es siempre quien la pone.
    setterId: wordSource === 'player' ? 1 : null,
    hintsUsed: 0,
    scores: { ...EMPTY_SCORES },
  };
}

/** Oculta la palabra mientras la partida sigue viva. */
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
