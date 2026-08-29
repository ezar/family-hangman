'use client';

import { motion } from 'framer-motion';
import { useT } from './LanguageProvider';

/**
 * Las fichas que salen ya "acertadas", en proporcion al largo de la palabra:
 * el guino a la mecanica funciona igual con AHORCADO que con HANGMAN.
 */
function revealedIndexes(length: number): Set<number> {
  return new Set([0, Math.floor(length * 0.4), Math.floor(length * 0.65), length - 1]);
}

export default function Logo({ compact = false }: { compact?: boolean }) {
  const t = useT();

  if (compact) {
    return (
      <span className="font-display text-lg font-semibold tracking-tight text-cream/80">
        {t.wordmarkShort}
      </span>
    );
  }

  return (
    <div className="flex flex-col items-center gap-3">
      <div className="flex gap-1">
        {t.wordmark.split('').map((letter, index, all) => {
          const revealed = revealedIndexes(all.length).has(index);
          return (
            <motion.span
              key={index}
              initial={{ rotateX: -90, opacity: 0 }}
              animate={{ rotateX: 0, opacity: 1 }}
              transition={{ delay: index * 0.06, type: 'spring', stiffness: 300, damping: 20 }}
              className={`grid h-10 w-[1.85rem] place-items-center rounded-lg font-display text-xl
                font-semibold sm:h-11 sm:w-8 sm:text-2xl
                ${
                  revealed
                    ? 'bg-gradient-to-b from-honey to-honey-deep text-ink shadow-key-sm'
                    : 'border border-white/12 bg-white/[0.05] text-cream/85'
                }`}
            >
              {letter}
            </motion.span>
          );
        })}
      </div>
      <p className="font-display text-sm font-medium tracking-[0.42em] text-honey/60">
        {t.tagline}
      </p>
    </div>
  );
}
