'use client';

import { useEffect, useRef } from 'react';
import { entryId, type GameKind, type HistoryEntry } from './history';
import { useGameStore } from './gameStore';

interface Finished {
  status: 'playing' | 'waiting' | 'won' | 'lost';
  word: string | null;
  wrongCount: number;
  maxWrong: number;
}

/**
 * Apunta la partida en el historial justo cuando termina. Solo reacciona al
 * cambio de estado, y el identificador incluye el numero de ronda, asi que ni
 * el sondeo de la sala ni una recarga la duplican.
 */
export function useRecordGame(
  kind: GameKind,
  code: string,
  round: number | string,
  game: Finished | null,
  extra: Omit<HistoryEntry, 'id' | 'kind' | 'at' | 'status' | 'word' | 'wrongCount' | 'maxWrong'>,
) {
  const recordGame = useGameStore((state) => state.recordGame);
  const recorded = useRef<string | null>(null);

  useEffect(() => {
    if (!game || (game.status !== 'won' && game.status !== 'lost')) return;
    // Al terminar, la palabra ya es publica; sin ella no merece la pena apuntar.
    if (!game.word) return;

    const id = entryId(kind, code, round);
    if (recorded.current === id) return;
    recorded.current = id;

    recordGame({
      id,
      kind,
      at: Date.now(),
      status: game.status,
      word: game.word,
      wrongCount: game.wrongCount,
      maxWrong: game.maxWrong,
      ...extra,
    });
    // `extra` se recrea en cada render; lo que decide es el identificador.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [game?.status, game?.word, kind, code, round, recordGame]);
}
