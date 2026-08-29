'use client';

import { motion } from 'framer-motion';
import type { Player } from '@/lib/types';

interface Props {
  players: Player[];
  turnIndex: number;
  myId: number | null;
  /** En `waiting` nadie tiene turno todavia: no marcamos a nadie. */
  active: boolean;
}

/** Color estable por jugador: el mismo id siempre pinta igual en todos los moviles. */
const COLORS = ['#ffbb38', '#4fd6a0', '#a878ff', '#ff6b6b', '#5ac8fa', '#ff9f68', '#f472b6', '#a3e635'];

export function playerColor(id: number): string {
  return COLORS[(id - 1) % COLORS.length];
}

export default function PlayersList({ players, turnIndex, myId, active }: Props) {
  return (
    <ul className="flex flex-wrap items-center justify-center gap-2">
      {players.map((player, index) => {
        const isTurn = active && index === turnIndex % players.length;
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
              {isMe && <span className="ml-1 text-[0.65rem] uppercase text-cream/40">tu</span>}
            </span>
          </motion.li>
        );
      })}
    </ul>
  );
}
