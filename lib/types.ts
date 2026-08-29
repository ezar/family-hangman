export type Language = 'es' | 'en';
export type Difficulty = 'infantil' | 'familiar' | 'experto';
export type GameStatus = 'waiting' | 'playing' | 'won' | 'lost';

export const LANGUAGES: Language[] = ['es', 'en'];
export const DIFFICULTIES: Difficulty[] = ['infantil', 'familiar', 'experto'];

export interface Player {
  id: number;
  name: string;
}

/** El blob completo que vive en Redis bajo `game:{roomCode}`. */
export interface Game {
  roomCode: string;
  language: Language;
  difficulty: Difficulty;
  status: GameStatus;
  word: string;
  guessed: string[];
  wrongCount: number;
  turnIndex: number;
  players: Player[];
  nextId: number;
}

/**
 * Lo que ve el cliente en el modo grupal: la palabra solo viaja cuando la
 * partida ya ha terminado. Mientras se juega, el cliente recibe unicamente
 * la mascara (letras acertadas y huecos), asi que no puede hacer trampa
 * mirando la respuesta de la API.
 */
export type PublicGame = Omit<Game, 'word'> & {
  word: string | null;
  masked: (string | null)[];
  wordLength: number;
};

export function isLanguage(value: unknown): value is Language {
  return typeof value === 'string' && (LANGUAGES as string[]).includes(value);
}

export function isDifficulty(value: unknown): value is Difficulty {
  return typeof value === 'string' && (DIFFICULTIES as string[]).includes(value);
}
