'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { motion } from 'framer-motion';
import { useT } from './LanguageProvider';
import { useGameStore } from '@/lib/gameStore';
import type { ChallengeSummary } from '@/lib/challenge';

/**
 * Los retos que ha creado esta persona, para volver a ver quien ha picado sin
 * tener que rescatar el enlace del chat donde lo mando.
 *
 * La lista vive en el navegador, asi que es de este dispositivo: sin cuentas
 * no hay forma de que te siga al portatil, y meter cuentas en un juego
 * familiar cuesta mas de lo que da.
 */
export default function MyChallenges({ hydrated }: { hydrated: boolean }) {
  const t = useT();
  const { myChallenges, forgetChallenges } = useGameStore();
  const [challenges, setChallenges] = useState<ChallengeSummary[] | null>(null);

  useEffect(() => {
    if (!hydrated || myChallenges.length === 0) {
      setChallenges([]);
      return;
    }

    let cancelled = false;
    (async () => {
      try {
        const response = await fetch(
          `/api/challenge/mine?codes=${encodeURIComponent(myChallenges.join(','))}`,
        );
        const data = await response.json();
        if (cancelled || !response.ok) return;

        const found = data.challenges as ChallengeSummary[];
        setChallenges(found);

        // Los que el servidor ya no conoce han caducado: fuera de la lista.
        const alive = new Set(found.map((challenge) => challenge.code));
        const expired = myChallenges.filter((code) => !alive.has(code));
        if (expired.length > 0) forgetChallenges(expired);
      } catch {
        if (!cancelled) setChallenges([]);
      }
    })();

    return () => {
      cancelled = true;
    };
    // Solo al montar y cuando cambie el conjunto de codigos guardados.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [hydrated, myChallenges.join(',')]);

  if (!challenges || challenges.length === 0) return null;

  return (
    <motion.section
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      className="flex flex-col gap-2"
    >
      <p className="label px-1">{t.myChallenges}</p>
      <ul className="flex flex-col gap-1.5">
        {challenges.map((challenge) => (
          <li key={challenge.code}>
            <Link
              href={`/reto/${challenge.code}`}
              className="panel flex items-center gap-3 p-3 transition-colors hover:border-white/20"
            >
              <span className="font-display text-base font-bold tracking-[0.15em] text-honey">
                {challenge.code}
              </span>
              <span className="flex-1 text-xs text-cream/40">
                {t.lettersCount(challenge.wordLength)}
              </span>
              <span className="text-xs text-cream/60">
                {challenge.tried === 0
                  ? t.nobodyYetShort
                  : t.triedAndSolved(challenge.tried, challenge.solved)}
              </span>
            </Link>
          </li>
        ))}
      </ul>
    </motion.section>
  );
}
