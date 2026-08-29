import { normalizeLetter, resolveAttempt } from './gameLogic';
import type { Game } from './types';
import type { GuessError, GuessResult } from './gameLogic';

/**
 * El ahorcado tramposo. Aqui no hay palabra elegida: el juego mantiene todas
 * las que siguen encajando con lo que has preguntado y, en cada letra, se
 * queda con el grupo mas numeroso. Es decir, responde lo que mas le conviene.
 *
 * Truco de implementacion: `game.word` guarda siempre una palabra cualquiera
 * del grupo vivo. Como todas las del grupo comparten las posiciones de las
 * letras ya preguntadas, cualquiera sirve de representante y el resto del
 * juego (mascara, victoria, derrota) funciona sin enterarse de nada.
 */

/** Posiciones de una letra dentro de una palabra: la huella que la delata. */
export function patternOf(word: string, letter: string): string {
  let pattern = '';
  for (const character of word) {
    pattern += character === letter ? letter : '.';
  }
  return pattern;
}

/**
 * Las palabras que todavia podrian ser la buena: mismo largo y, para cada
 * letra ya preguntada, exactamente las mismas posiciones que el representante.
 */
export function candidatesFor(words: string[], word: string, guessed: string[]): string[] {
  return words.filter(
    (candidate) =>
      candidate.length === word.length &&
      guessed.every((letter) => patternOf(candidate, letter) === patternOf(word, letter)),
  );
}

export interface EvilGroup {
  pattern: string;
  words: string[];
}

/**
 * De todos los grupos posibles, el que mas le conviene al juego: el mas
 * numeroso; a igualdad, el que no contiene la letra (revela menos); y a
 * igualdad tambien, el que menos veces la contiene. El ultimo desempate es
 * alfabetico, para que el resultado no dependa del orden del banco.
 */
export function chooseGroup(candidates: string[], letter: string): EvilGroup {
  const groups = new Map<string, string[]>();
  for (const candidate of candidates) {
    const pattern = patternOf(candidate, letter);
    const bucket = groups.get(pattern);
    if (bucket) bucket.push(candidate);
    else groups.set(pattern, [candidate]);
  }

  const occurrences = (pattern: string) => pattern.split(letter).length - 1;

  return [...groups.entries()]
    .map(([pattern, words]) => ({ pattern, words }))
    .sort((a, b) => {
      if (a.words.length !== b.words.length) return b.words.length - a.words.length;
      const [countA, countB] = [occurrences(a.pattern), occurrences(b.pattern)];
      if (countA !== countB) return countA - countB;
      return a.pattern.localeCompare(b.pattern);
    })[0];
}

/** Longitudes con suficientes palabras para que el juego tenga donde esconderse. */
export function playableLengths(words: string[], minimum = 20): number[] {
  const counts = new Map<number, number>();
  for (const word of words) {
    counts.set(word.length, (counts.get(word.length) ?? 0) + 1);
  }
  return [...counts.entries()]
    .filter(([, count]) => count >= minimum)
    .map(([length]) => length)
    .sort((a, b) => a - b);
}

const randomOf = <T,>(options: T[]): T => options[Math.floor(Math.random() * options.length)];

/**
 * Arranque de una partida tramposa: se fija una longitud con margen de sobra y
 * se toma cualquier palabra de ese largo como representante inicial.
 */
export function evilStart(
  words: string[],
  pick: <T>(options: T[]) => T = randomOf,
  minimum = 20,
): { word: string; candidatesLeft: number } | null {
  const lengths = playableLengths(words, minimum);
  if (lengths.length === 0) return null;

  const length = pick(lengths);
  const pool = words.filter((word) => word.length === length);
  return { word: pick(pool), candidatesLeft: pool.length };
}

export type EvilResult = GuessResult | { ok: false; error: GuessError };

/**
 * Aplica una letra en modo tramposo. Misma forma que `applyGuess`, para que
 * las rutas y el cliente no tengan que distinguir: lo unico distinto es que
 * "acertar" lo decide el grupo que le conviene al juego, no una palabra fija.
 */
export function applyEvilGuess(
  game: Game,
  playerId: number,
  rawLetter: string,
  words: string[],
  pick: <T>(options: T[]) => T = randomOf,
): EvilResult {
  if (game.status !== 'playing') return { ok: false, error: 'not-playing' };
  if (!game.players.some((player) => player.id === playerId)) {
    return { ok: false, error: 'unknown-player' };
  }

  const guessers = game.players.filter((player) => player.id !== game.setterId);
  const active = guessers[game.turnIndex % guessers.length];
  if (!active) return { ok: false, error: 'unknown-player' };
  if (active.id !== playerId) return { ok: false, error: 'not-your-turn' };

  const letter = normalizeLetter(rawLetter);
  if (!letter) return { ok: false, error: 'invalid-letter' };
  if (game.guessed.includes(letter)) return { ok: false, error: 'already-guessed' };

  const candidates = candidatesFor(words, game.word, game.guessed);
  // Si el banco no diese ninguna candidata, el representante actual vale: la
  // partida sigue como una normal en vez de romperse.
  const group = candidates.length > 0 ? chooseGroup(candidates, letter) : null;

  const word = group ? pick(group.words) : game.word;
  const correct = word.includes(letter);
  const guessed = [...game.guessed, letter];

  const next = resolveAttempt(
    { ...game, word },
    guessed,
    correct ? game.wrongCount : game.wrongCount + 1,
  );

  return {
    ok: true,
    correct,
    letter,
    game: { ...next, candidatesLeft: group ? group.words.length : 1 },
  };
}
