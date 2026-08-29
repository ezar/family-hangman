import esInfantil from '@/data/words/es-infantil.json';
import esFamiliar from '@/data/words/es-familiar.json';
import esExperto from '@/data/words/es-experto.json';
import enInfantil from '@/data/words/en-infantil.json';
import enFamiliar from '@/data/words/en-familiar.json';
import enExperto from '@/data/words/en-experto.json';
import type { Difficulty, Language } from './types';

const BANK: Record<Language, Record<Difficulty, string[]>> = {
  es: { infantil: esInfantil, familiar: esFamiliar, experto: esExperto },
  en: { infantil: enInfantil, familiar: enFamiliar, experto: enExperto },
};

export function wordList(language: Language, difficulty: Difficulty): string[] {
  return BANK[language][difficulty];
}

export function wordCount(language: Language, difficulty: Difficulty): number {
  return wordList(language, difficulty).length;
}

/**
 * Palabra al azar. `exclude` evita repetir la palabra recien jugada al
 * reiniciar; si la lista fuese diminuta y todo estuviese excluido, se ignora.
 */
export function randomWord(
  language: Language,
  difficulty: Difficulty,
  exclude?: string,
): string {
  const list = wordList(language, difficulty);
  const pool = exclude ? list.filter((word) => word !== exclude) : list;
  const source = pool.length > 0 ? pool : list;
  return source[Math.floor(Math.random() * source.length)];
}
