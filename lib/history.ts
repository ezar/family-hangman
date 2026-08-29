import type { Difficulty, Language } from './types';

/**
 * Historial de partidas. Se apunta en el navegador al terminar cada una: no
 * hay cuentas, asi que es el historial de este dispositivo, no el de esta
 * persona. Una sala jugada desde el movil no aparecera en el portatil.
 *
 * Tampoco vale leerlo del servidor: las salas caducan a las doce horas y su
 * marcador muere con ellas. Si no se apunta al terminar, se pierde.
 */
export type GameKind = 'solo' | 'room' | 'challenge';

export interface HistoryEntry {
  /** Identidad estable de la ronda: evita apuntarla dos veces al recargar. */
  id: string;
  kind: GameKind;
  at: number;
  status: 'won' | 'lost';
  word: string;
  wrongCount: number;
  maxWrong: number;
  language: Language;
  difficulty?: Difficulty;
  /** El codigo de la sala o del reto, para poder volver. */
  code?: string;
  /** Quien puso la palabra, cuando no la puso el juego. */
  author?: string;
  evil?: boolean;
}

/** Cuantas partidas se recuerdan. Mas seria acumular por acumular. */
export const MAX_HISTORY = 60;

/**
 * Identidad de una ronda. Para una sala o el modo solo se usa el numero de
 * ronda, que sale del propio marcador, asi que recargar con la partida
 * terminada no la duplica.
 */
export function entryId(kind: GameKind, code: string, round: number | string): string {
  return `${kind}:${code}:${round}`;
}

/** Anade una partida al historial, sin duplicados y con la mas reciente arriba. */
export function addEntry(history: HistoryEntry[], entry: HistoryEntry): HistoryEntry[] {
  if (history.some((existing) => existing.id === entry.id)) return history;
  return [entry, ...history].slice(0, MAX_HISTORY);
}

/** Cuentas del historial, para el resumen de cabecera. */
export function historyStats(history: HistoryEntry[]): {
  played: number;
  won: number;
  bestStreak: number;
} {
  let bestStreak = 0;
  let current = 0;

  // El historial va de reciente a antiguo; la racha se mide en orden de juego.
  for (const entry of [...history].reverse()) {
    if (entry.status === 'won') {
      current += 1;
      bestStreak = Math.max(bestStreak, current);
    } else {
      current = 0;
    }
  }

  return {
    played: history.length,
    won: history.filter((entry) => entry.status === 'won').length,
    bestStreak,
  };
}
