'use client';

import Link from 'next/link';
import { motion } from 'framer-motion';
import { useT } from './LanguageProvider';
import type { ChallengeSummary } from '@/lib/challenge';

/**
 * Los retos que ha creado esta persona, para volver a ver quien ha picado sin
 * tener que rescatar el enlace del chat donde lo mando.
 */
export default function MyChallenges({ challenges }: { challenges: ChallengeSummary[] }) {
  const t = useT();

  if (challenges.length === 0) return null;

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
