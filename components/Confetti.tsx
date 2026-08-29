'use client';

import { motion } from 'framer-motion';
import { useMemo } from 'react';

const COLORS = ['#ffbb38', '#4fd6a0', '#a878ff', '#ff6b6b', '#fff4e2'];

/** Lluvia de papelitos para la victoria. Decorativo, sin estado ni logica. */
export default function Confetti({ pieces = 44 }: { pieces?: number }) {
  const bits = useMemo(
    () =>
      Array.from({ length: pieces }, (_, index) => ({
        id: index,
        left: Math.random() * 100,
        delay: Math.random() * 0.6,
        duration: 2.2 + Math.random() * 1.6,
        drift: (Math.random() - 0.5) * 120,
        spin: Math.random() * 720 - 360,
        color: COLORS[index % COLORS.length],
        width: 6 + Math.random() * 6,
        height: 9 + Math.random() * 10,
      })),
    [pieces],
  );

  return (
    <div className="pointer-events-none absolute inset-0 overflow-hidden" aria-hidden>
      {bits.map((bit) => (
        <motion.span
          key={bit.id}
          initial={{ y: '-12vh', x: 0, rotate: 0, opacity: 1 }}
          animate={{ y: '110vh', x: bit.drift, rotate: bit.spin, opacity: [1, 1, 0] }}
          transition={{ duration: bit.duration, delay: bit.delay, ease: 'easeIn' }}
          className="absolute top-0 rounded-[2px]"
          style={{
            left: `${bit.left}%`,
            width: bit.width,
            height: bit.height,
            backgroundColor: bit.color,
          }}
        />
      ))}
    </div>
  );
}
