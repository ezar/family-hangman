'use client';

import Link from 'next/link';
import { motion } from 'framer-motion';
import HistoryList from '@/components/HistoryList';
import { LanguageProvider, useT } from '@/components/LanguageProvider';
import Logo from '@/components/Logo';
import MyChallenges from '@/components/MyChallenges';
import { useEffect } from 'react';
import { historyStats } from '@/lib/history';
import { useGameStore } from '@/lib/gameStore';
import { useHydratedStore } from '@/lib/useHydratedStore';
import { useMyChallenges } from '@/lib/useMyChallenges';

export default function HistoryPage() {
  const hydrated = useHydratedStore();
  const language = useGameStore((state) => state.language);

  return (
    <LanguageProvider language={hydrated ? language : 'es'}>
      <History hydrated={hydrated} />
    </LanguageProvider>
  );
}

function History({ hydrated }: { hydrated: boolean }) {
  const t = useT();
  const { history, clearHistory, markChallengesSeen } = useGameStore();
  const challenges = useMyChallenges(hydrated);
  const stats = historyStats(hydrated ? history : []);

  // Mirar el historial es haberlos visto: el aviso del inicio se apaga aqui.
  useEffect(() => {
    if (challenges.length === 0) return;
    markChallengesSeen(
      Object.fromEntries(challenges.map((challenge) => [challenge.code, challenge.tried])),
    );
  }, [challenges, markChallengesSeen]);

  return (
    <main className="flex flex-1 flex-col gap-5 py-5 safe-bottom">
      <header className="flex items-center justify-between gap-2">
        <Link href="/" className="text-sm text-cream/40 hover:text-cream/70">
          ← {t.home}
        </Link>
        <Logo compact />
        <span className="w-12" />
      </header>

      {stats.played > 0 && (
        <motion.ul
          initial={{ opacity: 0, y: -8 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex items-center justify-center gap-2"
        >
          {[
            { label: t.playedGames, value: stats.played, tone: 'text-cream' },
            { label: t.wins, value: stats.won, tone: 'text-mint' },
            { label: t.bestStreak, value: stats.bestStreak, tone: 'text-honey' },
          ].map((item) => (
            <li
              key={item.label}
              className="flex flex-col items-center rounded-2xl border border-white/10 bg-white/[0.04] px-5 py-2.5"
            >
              <span className={`font-display text-xl font-bold ${item.tone}`}>{item.value}</span>
              <span className="text-[0.62rem] uppercase tracking-wide text-cream/35">
                {item.label}
              </span>
            </li>
          ))}
        </motion.ul>
      )}

      <MyChallenges challenges={challenges} />

      <section className="flex flex-col gap-2">
        <p className="label px-1">{t.yourGames}</p>
        <HistoryList entries={hydrated ? history : []} />
      </section>

      {stats.played > 0 && (
        <button
          type="button"
          onClick={clearHistory}
          className="mx-auto text-xs text-cream/25 underline-offset-4 hover:text-coral hover:underline"
        >
          {t.clearHistory}
        </button>
      )}

      <p className="px-2 text-center text-[0.68rem] leading-relaxed text-cream/25">
        {t.historyIsLocal}
      </p>
    </main>
  );
}
