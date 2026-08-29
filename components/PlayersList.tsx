'use client';

import { motion } from 'framer-motion';
import type { Player } from '@/lib/types';

interface Props {
  players: Player[];
  turnIndex: number;
  myId: number | null;
  /** Quien pone la palabra no entra en el turno: se marca aparte. */
  setterId?: number | null;
  /** En `waiting` nadie tiene turno todavia: no marcamos a nadie. */
  active: boolean;
}

/** Color estable por jugador: el mismo id siempre pinta igual en todos los moviles. */
const COLORS = ['#ffbb38', '#4fd6a0', '#a878ff', '#ff6b6b', '#5ac8fa', '#ff9f68', '#f472b6', '#a3e635'];

export function playerColor(id: number): string {
  return COLORS[(id - 1) % COLORS.length];
}

export default function PlayersList({
  players,
  turnIndex,
  myId,
  setterId = null,
  active,
}: Props) {
  // El turno recorre solo a quienes adivinan.
  const guessing = players.filter((player) => player.id !== setterId);
  return (
    <ul className="flex flex-wrap items-center justify-center gap-2">
      {players.map((player) => {
        const isSetter = player.id === setterId;
        const turnPlayer = guessing.length > 0 ? guessing[turnIndex % guessing.length] : null;
        const isTurn = active && !isSetter && turnPlayer?.id === player.id;
        const isMe = player.id === myId;
        const color = playerColor(player.id);

        return (
          <motion.li
            key={player.id}
            layout
            initial={{ opacity: 0, scale: 0.85 }}
            animate={{ opacity: 1, scale: isTurn ? 1 : 0.96 }}
            transition={{ type: 'spring', stiffness: 320, damping: 24 }}
            className={`flex items-center gap-2 rounded-full border py-1.5 pl-1.5 pr-3.5 transition-colors
              ${isTurn ? 'border-white/25 bg-white/[0.12]' : 'border-white/10 bg-white/[0.04]'}`}
          >
            <span
              className={`grid h-7 w-7 place-items-center rounded-full font-display text-sm font-bold text-ink
                ${isTurn ? 'animate-pulse-ring' : ''}`}
              style={{ backgroundColor: color }}
            >
              {player.name.charAt(0).toUpperCase()}
            </span>
            <span
              className={`font-display text-sm ${isTurn ? 'text-cream' : 'text-cream/55'}`}
            >
              {player.name}
              {isMe && <span className="ml-1 text-[0.65rem] uppercase text-cream/40">tú</span>}
              {isSetter && (
                <svg
                  viewBox="0 0 24 24"
                  className="ml-1 inline h-3.5 w-3.5 text-honey/80"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2.2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  aria-label="pone la palabra"
                >
                  <path d="M12 20h9M16.5 3.5a2.1 2.1 0 0 1 3 3L7 19l-4 1 1-4Z" />
                </svg>
              )}
            </span>
          </motion.li>
        );
      })}
    </ul>
  );
}
