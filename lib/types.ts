export type Language = 'es' | 'en';
export type Difficulty = 'infantil' | 'familiar' | 'experto';
export type GameStatus = 'waiting' | 'playing' | 'won' | 'lost';
/**
 * De donde sale la palabra: del banco, de un jugador que la escribe, o de
 * ningun sitio, porque en el modo tramposo no hay palabra elegida hasta el
 * final: el juego va esquivando entre todas las que siguen encajando.
 */
export type WordSource = 'list' | 'player' | 'evil';

export const LANGUAGES: Language[] = ['es', 'en'];
export const DIFFICULTIES: Difficulty[] = ['infantil', 'familiar', 'experto'];

export interface Player {
  id: number;
  name: string;
}

/** Marcador de la sala, acumulado entre rondas. */
export interface Scores {
  wins: number;
  losses: number;
  /** Victorias seguidas; se corta al perder. */
  streak: number;
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
  /** Fallos permitidos; depende de la dificultad. */
  maxWrong: number;
  turnIndex: number;
  players: Player[];
  nextId: number;
  wordSource: WordSource;
  /** Quien pone la palabra: no juega turnos ni ve el teclado. */
  setterId: number | null;
  /** Comodines gastados en la ronda actual. */
  hintsUsed: number;
  /** Solo en el modo tramposo: cuantas palabras siguen siendo posibles. */
  candidatesLeft?: number;
  scores: Scores;
}

/**
 * Lo que ve el cliente: la palabra solo viaja cuando la partida ya ha
 * terminado. Mientras se juega solo va la mascara, asi que nadie puede hacer
 * trampa mirando la respuesta de la API.
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
