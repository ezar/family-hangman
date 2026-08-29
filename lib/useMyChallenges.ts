'use client';

import { useEffect, useState } from 'react';
import { useGameStore } from './gameStore';
import type { ChallengeSummary } from './challenge';

/**
 * Los retos que ha creado esta persona, con sus datos vivos. Lo usan el inicio
 * (para avisar de intentos nuevos) y el historial (para listarlos), asi que
 * vive aqui en vez de duplicarse en los dos.
 */
export function useMyChallenges(hydrated: boolean): ChallengeSummary[] {
  const myChallenges = useGameStore((state) => state.myChallenges);
  const forgetChallenges = useGameStore((state) => state.forgetChallenges);
  const [challenges, setChallenges] = useState<ChallengeSummary[]>([]);

  // La lista de codigos como texto: el efecto solo se repite si cambia de verdad.
  const codes = myChallenges.join(',');

  useEffect(() => {
    if (!hydrated || codes === '') {
      setChallenges([]);
      return;
    }

    let cancelled = false;
    (async () => {
      try {
        const response = await fetch(`/api/challenge/mine?codes=${encodeURIComponent(codes)}`);
        const data = await response.json();
        if (cancelled || !response.ok) return;

        const found = data.challenges as ChallengeSummary[];
        setChallenges(found);

        // Los que el servidor ya no conoce han caducado: fuera de la lista.
        const alive = new Set(found.map((challenge) => challenge.code));
        const expired = codes.split(',').filter((code) => !alive.has(code));
        if (expired.length > 0) forgetChallenges(expired);
      } catch {
        if (!cancelled) setChallenges([]);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [hydrated, codes, forgetChallenges]);

  return challenges;
}
