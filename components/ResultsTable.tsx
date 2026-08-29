'use client';

import { useT } from './LanguageProvider';
import type { AttemptResult } from '@/lib/challenge';

/** Quien ha intentado el reto y como le fue. Es el premio de quien lo creo. */
export default function ResultsTable({ results }: { results: AttemptResult[] }) {
  const t = useT();

  if (results.length === 0) {
    return <p className="text-center text-sm text-cream/35">{t.nobodyYet}</p>;
  }

  return (
    <ul className="flex flex-col gap-1.5">
      {results.map((result, index) => (
        <li
          key={`${result.name}-${result.at}-${index}`}
          className="flex items-center gap-3 rounded-xl border border-white/10 bg-white/[0.04] px-3 py-2.5"
        >
          <span className="w-5 text-center font-display text-sm text-cream/30">{index + 1}</span>
          <span className="text-lg" aria-hidden>
            {result.status === 'won' ? '🎉' : '💀'}
          </span>
          <span className="flex-1 truncate font-display text-base">{result.name}</span>
          <span
            className={`text-xs ${result.status === 'won' ? 'text-mint' : 'text-coral'}`}
          >
            {result.status === 'won' ? t.mistakes(result.wrongCount) : t.couldNot}
          </span>
        </li>
      ))}
    </ul>
  );
}
