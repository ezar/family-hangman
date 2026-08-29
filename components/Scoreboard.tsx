'use client';

import { useT } from './LanguageProvider';
import type { Scores } from '@/lib/types';

/** Marcador de la sala: acumulado entre rondas, no entre salas. */
export default function Scoreboard({ scores }: { scores: Scores }) {
  const t = useT();

  if (scores.wins === 0 && scores.losses === 0) return null;

  const items = [
    { label: t.wins, value: scores.wins, tone: 'text-mint' },
    { label: t.losses, value: scores.losses, tone: 'text-coral' },
    ...(scores.streak >= 2 ? [{ label: t.streak, value: scores.streak, tone: 'text-honey' }] : []),
  ];

  return (
    <ul className="flex items-center justify-center gap-2">
      {items.map((item) => (
        <li
          key={item.label}
          className="flex items-center gap-1.5 rounded-full border border-white/10 bg-white/[0.04] px-3 py-1"
        >
          <span className={`font-display text-sm font-bold ${item.tone}`}>{item.value}</span>
          <span className="text-[0.65rem] uppercase tracking-wide text-cream/35">{item.label}</span>
        </li>
      ))}
    </ul>
  );
}
