'use client';

import { AnimatePresence, motion } from 'framer-motion';
import { useT } from './LanguageProvider';

interface Props {
  /** Una entrada por letra: la letra si esta acertada, null si sigue oculta. */
  masked: (string | null)[];
  /** Al perder revelamos la palabra entera, marcando lo que faltaba. */
  reveal?: string | null;
}

export default function WordDisplay({ masked, reveal }: Props) {
  const t = useT();
  // Las palabras largas encogen las fichas para no salirse del movil.
  const size =
    masked.length > 12
      ? 'h-10 w-[1.45rem] text-lg'
      : masked.length > 8
        ? 'h-12 w-[1.85rem] text-xl'
        : 'h-14 w-10 text-3xl';

  return (
    <div className="flex flex-wrap items-center justify-center gap-1" aria-live="polite">
      {masked.map((letter, index) => {
        const missed = !letter && reveal ? reveal[index] : null;
        const shown = letter ?? missed;

        return (
          <div
            key={index}
            className={`relative ${size} [perspective:600px]`}
            aria-label={letter ?? t.gap}
          >
            <AnimatePresence mode="wait" initial={false}>
              {shown ? (
                <motion.span
                  key="filled"
                  initial={{ rotateX: -90, opacity: 0 }}
                  animate={{ rotateX: 0, opacity: 1 }}
                  transition={{ type: 'spring', stiffness: 320, damping: 22 }}
                  className={`absolute inset-0 flex items-center justify-center rounded-xl font-display
                    font-semibold uppercase text-shadow-hard
                    ${
                      missed
                        ? 'border border-coral/40 bg-coral/15 text-coral'
                        : 'bg-gradient-to-b from-honey to-honey-deep text-ink shadow-key-sm'
                    }`}
                >
                  {shown}
                </motion.span>
              ) : (
                <motion.span
                  key="empty"
                  exit={{ opacity: 0 }}
                  className="absolute inset-0 rounded-xl border border-white/10 bg-white/[0.04]
                             after:absolute after:inset-x-2 after:bottom-1.5 after:h-[3px]
                             after:rounded-full after:bg-cream/20"
                />
              )}
            </AnimatePresence>
          </div>
        );
      })}
    </div>
  );
}
