'use client';

import { AnimatePresence, motion } from 'framer-motion';
import Confetti from './Confetti';
import Scoreboard from './Scoreboard';
import type { Scores } from '@/lib/types';

interface Props {
  status: 'won' | 'lost' | null;
  word: string | null;
  /** Texto del boton principal; null oculta el boton (p.ej. sin permiso). */
  actionLabel?: string;
  onAction?: () => void;
  busy?: boolean;
  secondary?: React.ReactNode;
  /** En solitario se gana en singular; en sala, en plural. */
  winTitle?: string;
  scores?: Scores;
  /** En el modo tramposo, la confesion: no habia palabra elegida. */
  evil?: boolean;
  /** Contenido extra antes del boton (por ejemplo, pedir la palabra siguiente). */
  children?: React.ReactNode;
}

export default function ResultOverlay({
  status,
  word,
  actionLabel = 'Otra palabra',
  onAction,
  busy = false,
  secondary,
  winTitle = '¡Ganasteis!',
  scores,
  evil = false,
  children,
}: Props) {
  const won = status === 'won';

  return (
    <AnimatePresence>
      {status && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-50 flex items-center justify-center bg-ink/80 px-6 backdrop-blur-md"
          role="dialog"
          aria-modal
        >
          {won && <Confetti />}

          <motion.div
            initial={{ scale: 0.85, y: 24, opacity: 0 }}
            animate={{ scale: 1, y: 0, opacity: 1 }}
            exit={{ scale: 0.9, opacity: 0 }}
            transition={{ type: 'spring', stiffness: 280, damping: 22 }}
            className="panel relative w-full max-w-sm p-8 text-center"
          >
            <motion.div
              initial={{ scale: 0, rotate: -25 }}
              animate={{ scale: 1, rotate: 0 }}
              transition={{ type: 'spring', stiffness: 260, damping: 14, delay: 0.1 }}
              className="mx-auto mb-4 text-6xl"
            >
              {won ? '🎉' : '💀'}
            </motion.div>

            <h2
              className={`font-display text-4xl font-bold text-shadow-hard ${
                won ? 'text-mint' : 'text-coral'
              }`}
            >
              {won ? winTitle : 'Se acabó'}
            </h2>

            {word && (
              <p className="mt-3 text-sm text-cream/55">
                {evil ? 'Acabó siendo' : 'La palabra era'}{' '}
                <strong className="font-display text-lg uppercase tracking-widest text-cream">
                  {word}
                </strong>
              </p>
            )}

            {evil && (
              <p className="mt-4 rounded-xl border border-grape/30 bg-grape/10 px-4 py-3 text-sm text-grape">
                No había ninguna palabra elegida: el juego iba cambiándola sobre la marcha
                entre todas las que encajaban con tus respuestas.
              </p>
            )}

            {scores && (
              <div className="mt-5">
                <Scoreboard scores={scores} />
              </div>
            )}

            {children}

            {onAction && (
              <button
                type="button"
                onClick={onAction}
                disabled={busy}
                className="btn-primary mt-5 w-full"
              >
                {busy ? 'Cargando...' : actionLabel}
              </button>
            )}
            {secondary && <div className="mt-3">{secondary}</div>}
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
