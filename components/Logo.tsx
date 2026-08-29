'use client';

import { motion } from 'framer-motion';

const WORD = 'AHORCADO';
/** Las fichas que salen ya "acertadas": el guino a la mecanica del juego. */
const REVEALED = new Set([0, 3, 5, 7]);

export default function Logo({ compact = false }: { compact?: boolean }) {
  if (compact) {
    return (
      <span className="font-display text-lg font-semibold tracking-tight text-cream/80">
        Ahorcado
      </span>
    );
  }

  return (
    <div className="flex flex-col items-center gap-3">
      <div className="flex gap-1">
        {WORD.split('').map((letter, index) => {
          const revealed = REVEALED.has(index);
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
        EN FAMILIA
      </p>
    </div>
  );
}
