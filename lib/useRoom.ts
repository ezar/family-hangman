'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import type { PublicGame } from './types';

const POLL_MS = 1000;

interface RoomState {
  game: PublicGame | null;
  error: string | null;
  loading: boolean;
}

async function request(path: string, init?: RequestInit) {
  const response = await fetch(path, init);
  const data = await response.json().catch(() => ({}));
  if (!response.ok) throw new Error(data.error ?? 'No se pudo contactar con la sala');
  return data as { game: PublicGame; correct?: boolean };
}

/**
 * Estado compartido de la sala. Como en Vercel no hay socket que aguante entre
 * peticiones, preguntamos una vez por segundo; para un juego por turnos sobra.
 */
export function useRoom(roomCode: string, playerId: number | null) {
  const [state, setState] = useState<RoomState>({ game: null, error: null, loading: true });
  const [actionError, setActionError] = useState<string | null>(null);
  // Ignora respuestas de un poll que salio antes de una mutacion mas reciente.
  const version = useRef(0);

  const applyGame = useCallback((game: PublicGame) => {
    version.current += 1;
    setState({ game, error: null, loading: false });
  }, []);

  useEffect(() => {
    let cancelled = false;

    async function poll() {
      const seen = version.current;
      try {
        const data = await request(`/api/state?room=${encodeURIComponent(roomCode)}`);
        if (cancelled || version.current !== seen) return;
        setState({ game: data.game, error: null, loading: false });
      } catch (problem) {
        if (cancelled) return;
        setState((current) => ({
          ...current,
          loading: false,
          error: problem instanceof Error ? problem.message : 'Error de conexión',
        }));
      }
    }

    poll();
    const timer = setInterval(poll, POLL_MS);
    return () => {
      cancelled = true;
      clearInterval(timer);
    };
  }, [roomCode]);

  const guess = useCallback(
    async (letter: string) => {
      if (playerId === null) return;
      setActionError(null);
      try {
        const data = await request('/api/guess', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ room: roomCode, playerId, letter }),
        });
        applyGame(data.game);
      } catch (problem) {
        setActionError(problem instanceof Error ? problem.message : 'No se pudo enviar la letra');
      }
    },
    [applyGame, playerId, roomCode],
  );

  const restart = useCallback(async () => {
    setActionError(null);
    try {
      const data = await request('/api/restart', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ room: roomCode }),
      });
      applyGame(data.game);
    } catch (problem) {
      setActionError(problem instanceof Error ? problem.message : 'No se pudo reiniciar');
    }
  }, [applyGame, roomCode]);

  return { ...state, actionError, guess, restart };
}
