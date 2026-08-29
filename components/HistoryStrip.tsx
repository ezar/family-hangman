'use client';

import Link from 'next/link';
import { motion } from 'framer-motion';
import { useT } from './LanguageProvider';
import { historyStats } from '@/lib/history';
import { newAttempts } from '@/lib/challenge';
import { useGameStore } from '@/lib/gameStore';
import type { ChallengeSummary } from '@/lib/challenge';

/**
 * La entrada al historial desde el inicio. Es una tira con tus numeros en vez
 * de un enlace suelto: da un motivo para tocarla, se lee como contenido y no
 * compite con las tarjetas de los modos, que es a lo que se viene.
 *
 * Cuando alguien ha jugado uno de tus retos desde la ultima vez que miraste,
 * eso manda: es lo que de verdad hace volver.
 */
export default function HistoryStrip({ challenges }: { challenges: ChallengeSummary[] }) {
  const t = useT();
  const history = useGameStore((state) => state.history);
  const seenAttempts = useGameStore((state) => state.seenAttempts);

  const stats = historyStats(history);
  const pending = newAttempts(challenges, seenAttempts);

  if (stats.played === 0 && challenges.length === 0) return null;

  return (
    <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}>
      <Link
        href="/historial"
        className="panel flex items-center gap-3 px-4 py-3 transition-colors hover:border-white/20"
      >
        <span className="flex min-w-0 flex-1 flex-col gap-0.5">
          {pending > 0 && (
            <span className="flex items-center gap-2 font-display text-sm text-honey">
              <span className="relative flex h-2 w-2 shrink-0">
                <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-honey opacity-60" />
                <span className="relative inline-flex h-2 w-2 rounded-full bg-honey" />
              </span>
              {t.newAttempts(pending)}
            </span>
          )}

          {stats.played > 0 ? (
            <span className="truncate text-xs text-cream/45">
              {t.statsLine(stats.played, stats.won, stats.bestStreak)}
            </span>
          ) : (
            <span className="truncate text-xs text-cream/45">{t.myHistory}</span>
          )}
        </span>

        <span className="shrink-0 text-lg text-cream/30" aria-hidden>
          ›
        </span>
      </Link>
    </motion.div>
  );
}
