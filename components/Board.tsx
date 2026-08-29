'use client';

import { useEffect, useRef, useState } from 'react';
import { motion } from 'framer-motion';
import HangmanDrawing from './HangmanDrawing';
import Keyboard from './Keyboard';
import LivesMeter from './LivesMeter';
import WordDisplay from './WordDisplay';
import { useT } from './LanguageProvider';

interface Props {
  masked: (string | null)[];
  guessed: string[];
  hits: string[];
  wrongCount: number;
  maxWrong: number;
  lost: boolean;
  disabled: boolean;
  onGuess: (letter: string) => void;
  /** Comodin: null lo oculta (por ejemplo para quien pone la palabra). */
  onHint?: (() => void) | null;
  hintAvailable?: boolean;
  banner?: React.ReactNode;
  reveal?: string | null;
}

export default function Board({
  masked,
  guessed,
  hits,
  wrongCount,
  maxWrong,
  lost,
  disabled,
  onGuess,
  onHint,
  hintAvailable = false,
  banner,
  reveal,
}: Props) {
  const t = useT();
  // Cada fallo nuevo sacude el tablero: el aviso llega antes que el dibujo.
  const [shakes, setShakes] = useState(0);
  const previousWrong = useRef(wrongCount);

  useEffect(() => {
    if (wrongCount > previousWrong.current) {
      setShakes((count) => count + 1);
    }
    previousWrong.current = wrongCount;
  }, [wrongCount]);

  return (
    <div className="flex flex-1 flex-col gap-3">
      {banner}

      <motion.div
        key={shakes}
        animate={shakes > 0 ? { x: [0, -9, 8, -6, 4, 0] } : undefined}
        transition={{ duration: 0.42 }}
        className="flex flex-1 flex-col justify-center gap-5"
      >
        {/* Altura acotada: el escenario no debe comerse el sitio de la palabra. */}
        <div
          className="panel relative flex max-h-[42vh] min-h-[13rem] flex-1 items-center
                     justify-center overflow-hidden px-4 py-4"
        >
          <div className="absolute left-4 top-4">
            <LivesMeter wrongCount={wrongCount} maxWrong={maxWrong} />
          </div>

          {onHint && (
            <button
              type="button"
              onClick={onHint}
              disabled={!hintAvailable}
              className="absolute right-3 top-3 flex items-center gap-1.5 rounded-xl border
                         border-honey/30 bg-honey/10 px-3 py-2 font-display text-sm text-honey
                         transition-colors enabled:hover:bg-honey/20
                         disabled:border-white/5 disabled:bg-transparent disabled:text-cream/20"
            >
              <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M9 18h6M10 22h4M12 2a7 7 0 0 0-4 12.7V17h8v-2.3A7 7 0 0 0 12 2Z" />
              </svg>
              {t.hint}
            </button>
          )}

          <div className="relative h-full w-full max-w-[14rem]">
            <HangmanDrawing wrongCount={wrongCount} maxWrong={maxWrong} lost={lost} />
          </div>
        </div>

        <WordDisplay masked={masked} reveal={reveal} />
      </motion.div>

      <div className="safe-bottom">
        <Keyboard guessed={guessed} hits={hits} disabled={disabled} onGuess={onGuess} />
      </div>
    </div>
  );
}
