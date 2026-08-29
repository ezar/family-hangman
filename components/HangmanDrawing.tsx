'use client';

import { motion } from 'framer-motion';
import { MAX_WRONG } from '@/lib/gameLogic';

interface Props {
  wrongCount: number;
  lost?: boolean;
}

const STROKE = {
  strokeLinecap: 'round',
  strokeLinejoin: 'round',
  fill: 'none',
} as const;

/** Cada fallo dibuja una pieza, y la pieza se traza sola con pathLength. */
const draw = {
  hidden: { pathLength: 0, opacity: 0 },
  visible: {
    pathLength: 1,
    opacity: 1,
    transition: { pathLength: { duration: 0.5, ease: 'easeInOut' }, opacity: { duration: 0.12 } },
  },
};

export default function HangmanDrawing({ wrongCount, lost = false }: Props) {
  const shown = Math.min(wrongCount, MAX_WRONG);
  // El trazo se calienta hacia el rojo segun se acerca el final.
  const stroke = lost ? '#ff6b6b' : shown >= MAX_WRONG - 1 ? '#ff9f68' : '#ffbb38';

  const anim = { variants: draw, initial: 'hidden' as const, animate: 'visible' as const };
  const limb = { ...STROKE, ...anim, stroke, strokeWidth: 7 };

  const parts = [
    <motion.circle key="head" cx="132" cy="72" r="21" {...limb} />,
    <motion.line key="body" x1="132" y1="93" x2="132" y2="142" {...limb} />,
    <motion.line key="arm-l" x1="132" y1="106" x2="106" y2="126" {...limb} />,
    <motion.line key="arm-r" x1="132" y1="106" x2="158" y2="126" {...limb} />,
    <motion.line key="leg-l" x1="132" y1="142" x2="110" y2="174" {...limb} />,
    <motion.line key="leg-r" x1="132" y1="142" x2="154" y2="174" {...limb} />,
  ];

  return (
    <svg
      viewBox="0 0 200 200"
      className="h-full w-full drop-shadow-[0_10px_28px_rgba(0,0,0,0.5)]"
      role="img"
      aria-label={`Fallos: ${shown} de ${MAX_WRONG}`}
    >
      {/* Sombra en el suelo: asienta la horca en lugar de dejarla flotando. */}
      <ellipse cx="54" cy="190" rx="42" ry="6" fill="rgba(0,0,0,0.35)" />

      {/* Horca de madera: siempre visible, en tono apagado para que la figura mande. */}
      <g stroke="#6b5470" strokeWidth="12" {...STROKE}>
        <line x1="20" y1="188" x2="88" y2="188" />
        <line x1="54" y1="188" x2="54" y2="18" />
        <line x1="50" y1="18" x2="132" y2="18" />
      </g>
      {/* Diagonal de refuerzo y cuerda, mas finas que la estructura. */}
      <g stroke="#6b5470" strokeWidth="8" {...STROKE}>
        <line x1="54" y1="54" x2="88" y2="18" />
      </g>
      <line x1="132" y1="18" x2="132" y2="51" stroke="#8a6f52" strokeWidth="5" {...STROKE} />

      {/* La figura cuelga del extremo de la cuerda y se balancea al perder. */}
      <motion.g
        style={{ originX: '132px', originY: '51px' }}
        animate={lost ? { rotate: [0, 5, -4, 3, -2, 0] } : { rotate: 0 }}
        transition={lost ? { duration: 2.6, repeat: Infinity, ease: 'easeInOut' } : undefined}
      >
        {parts.slice(0, shown)}

        {/* La cara aparece con la cabeza y se va apagando con cada fallo. */}
        {shown >= 1 && (
          <motion.g
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.35 }}
            stroke={stroke}
            strokeWidth="3.5"
            {...STROKE}
          >
            {lost ? (
              <>
                <path d="M124 66l7 7M131 66l-7 7" />
                <path d="M137 66l7 7M144 66l-7 7" />
                <path d="M125 84q7-6 14 0" />
              </>
            ) : (
              <>
                <circle cx="126" cy="69" r="2" fill={stroke} stroke="none" />
                <circle cx="139" cy="69" r="2" fill={stroke} stroke="none" />
                <path d={shown >= 4 ? 'M125 84q7-6 14 0' : 'M126 80q6 5 12 0'} />
              </>
            )}
          </motion.g>
        )}
      </motion.g>
    </svg>
  );
}
