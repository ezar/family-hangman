'use client';

import { useEffect, useRef, useState } from 'react';
import { motion } from 'framer-motion';
import HangmanDrawing from './HangmanDrawing';
import Keyboard from './Keyboard';
import LivesMeter from './LivesMeter';
import WordDisplay from './WordDisplay';

interface Props {
  masked: (string | null)[];
  guessed: string[];
  hits: string[];
  wrongCount: number;
  lost: boolean;
  disabled: boolean;
  onGuess: (letter: string) => void;
  /** Banda superior: de quien es el turno, o el aviso de la sala. */
  banner?: React.ReactNode;
  reveal?: string | null;
}

export default function Board({
  masked,
  guessed,
  hits,
  wrongCount,
  lost,
  disabled,
  onGuess,
  banner,
  reveal,
}: Props) {
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
        {/* El escenario: un panel que enmarca el dibujo para que no flote en
            medio de la pantalla, con las vidas en una esquina. */}
        {/* Altura acotada: el escenario no debe comerse el sitio de la palabra. */}
        <div
          className="panel relative flex max-h-[42vh] min-h-[13rem] flex-1 items-center
                     justify-center overflow-hidden px-4 py-4"
        >
          <div className="absolute left-4 top-4">
            <LivesMeter wrongCount={wrongCount} />
          </div>
          <div className="relative h-full w-full max-w-[14rem]">
            <HangmanDrawing wrongCount={wrongCount} lost={lost} />
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
