'use client';

import { AnimatePresence, motion } from 'framer-motion';

/**
 * Cuantas palabras siguen encajando. Es el termometro del modo tramposo: ver
 * el numero caer de 180 a 3 es la mitad de la gracia.
 */
export default function CandidateCount({ count }: { count?: number }) {
  if (count === undefined) return null;

  return (
    <div className="flex items-center justify-center gap-2 text-xs">
      <span className="text-cream/35">Aún encajan</span>
      <AnimatePresence mode="popLayout">
        <motion.span
          key={count}
          initial={{ y: -8, opacity: 0, scale: 1.25 }}
          animate={{ y: 0, opacity: 1, scale: 1 }}
          exit={{ y: 8, opacity: 0 }}
          transition={{ type: 'spring', stiffness: 400, damping: 26 }}
          className={`font-display text-base font-bold ${
            count <= 3 ? 'text-mint' : count <= 20 ? 'text-honey' : 'text-cream/70'
          }`}
        >
          {count}
        </motion.span>
      </AnimatePresence>
      <span className="text-cream/35">{count === 1 ? 'palabra' : 'palabras'}</span>
    </div>
  );
}
