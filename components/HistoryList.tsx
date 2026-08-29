'use client';

import Link from 'next/link';
import { motion } from 'framer-motion';
import { useT } from './LanguageProvider';
import type { HistoryEntry } from '@/lib/history';

const ICON: Record<HistoryEntry['kind'], string> = {
  solo: '🎯',
  room: '👨‍👩‍👧',
  challenge: '✉️',
};

function when(at: number, locale: string): string {
  return new Date(at).toLocaleDateString(locale, {
    day: 'numeric',
    month: 'short',
    hour: '2-digit',
    minute: '2-digit',
  });
}

/** Las partidas terminadas en este dispositivo, de la más reciente hacia atrás. */
export default function HistoryList({ entries }: { entries: HistoryEntry[] }) {
  const t = useT();

  if (entries.length === 0) {
    return <p className="text-center text-sm text-cream/35">{t.noGamesYet}</p>;
  }

  return (
    <ul className="flex flex-col gap-1.5">
      {entries.map((entry, index) => {
        const row = (
          <div
            className={`panel flex items-center gap-3 p-3 ${
              entry.code ? 'transition-colors hover:border-white/20' : ''
            }`}
          >
            <span className="text-xl" aria-hidden>
              {ICON[entry.kind]}
            </span>

            <span className="flex min-w-0 flex-1 flex-col">
              <span className="truncate font-display text-base uppercase tracking-wide">
                {entry.word}
              </span>
              <span className="truncate text-[0.68rem] text-cream/35">
                {t.kindLabel[entry.kind]}
                {entry.evil ? ` · ${t.wordEvil}` : ''}
                {entry.author ? ` · ${entry.author}` : ''}
                {` · ${when(entry.at, entry.language)}`}
              </span>
            </span>

            <span
              className={`shrink-0 text-right text-xs ${
                entry.status === 'won' ? 'text-mint' : 'text-coral'
              }`}
            >
              {entry.status === 'won' ? t.mistakes(entry.wrongCount) : t.couldNot}
            </span>
          </div>
        );

        return (
          <motion.li
            key={entry.id}
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: Math.min(index, 8) * 0.03 }}
          >
            {/* Solo las salas y los retos tienen sitio al que volver. */}
            {entry.kind === 'room' && entry.code ? (
              <Link href={`/room/${entry.code}`}>{row}</Link>
            ) : entry.kind === 'challenge' && entry.code ? (
              <Link href={`/reto/${entry.code}`}>{row}</Link>
            ) : (
              row
            )}
          </motion.li>
        );
      })}
    </ul>
  );
}
