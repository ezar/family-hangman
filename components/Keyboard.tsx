'use client';

import { useEffect } from 'react';
import { motion } from 'framer-motion';
import { useT } from './LanguageProvider';

const ROWS = ['qwertyuiop', 'asdfghjkl', 'zxcvbnm'].map((row) => row.split(''));

interface Props {
  guessed: string[];
  /** Letras acertadas, para pintarlas distinto de las falladas. */
  hits: string[];
  disabled?: boolean;
  onGuess: (letter: string) => void;
}

export default function Keyboard({ guessed, hits, disabled = false, onGuess }: Props) {
  const t = useT();
  // Teclado fisico para quien juegue desde el ordenador.
  useEffect(() => {
    if (disabled) return undefined;

    const onKeyDown = (event: KeyboardEvent) => {
      if (event.metaKey || event.ctrlKey || event.altKey) return;
      const letter = event.key.toLowerCase();
      if (/^[a-z]$/.test(letter) && !guessed.includes(letter)) {
        onGuess(letter);
      }
    };

    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [disabled, guessed, onGuess]);

  return (
    <div className="flex flex-col items-center gap-1.5 select-none" role="group" aria-label={t.keyboard}>
      {ROWS.map((row, rowIndex) => (
        <div key={rowIndex} className="flex w-full justify-center gap-1.5">
          {row.map((letter) => {
            const used = guessed.includes(letter);
            const hit = hits.includes(letter);

            return (
              <motion.button
                key={letter}
                type="button"
                whileTap={used || disabled ? undefined : { y: 3 }}
                onClick={() => onGuess(letter)}
                disabled={used || disabled}
                aria-label={letter}
                className={`h-12 flex-1 max-w-[2.6rem] rounded-xl font-display text-lg font-semibold
                  uppercase transition-colors duration-150
                  ${
                    hit
                      ? 'bg-gradient-to-b from-mint to-mint-deep text-ink shadow-key-sm'
                      : used
                        ? 'bg-black/30 text-cream/20 line-through decoration-coral/60 decoration-2'
                        : 'bg-white/[0.09] text-cream shadow-key-sm hover:bg-white/[0.16] disabled:opacity-40'
                  }`}
              >
                {letter}
              </motion.button>
            );
          })}
        </div>
      ))}
    </div>
  );
}
