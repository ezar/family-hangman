'use client';

import { useCallback, useMemo, useState } from 'react';
import Link from 'next/link';
import { motion } from 'framer-motion';
import Board from '@/components/Board';
import Logo from '@/components/Logo';
import PlayersList from '@/components/PlayersList';
import ResultOverlay from '@/components/ResultOverlay';
import ShareRoom from '@/components/ShareRoom';
import { currentPlayer } from '@/lib/gameLogic';
import { useGameStore } from '@/lib/gameStore';
import { useHydratedStore } from '@/lib/useHydratedStore';
import { useRoom } from '@/lib/useRoom';

export default function RoomClient({ roomCode }: { roomCode: string }) {
  const hydrated = useHydratedStore();
  const { name, setName, rememberIdentity, identities } = useGameStore();
  const playerId = hydrated ? (identities[roomCode] ?? null) : null;

  const { game, error, loading, actionError, guess, restart } = useRoom(roomCode, playerId);
  const [joining, setJoining] = useState(false);
  const [joinError, setJoinError] = useState<string | null>(null);

  const join = useCallback(async () => {
    setJoining(true);
    setJoinError(null);
    try {
      const response = await fetch('/api/join', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ room: roomCode, name }),
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error ?? 'No se pudo entrar');
      rememberIdentity({ roomCode, playerId: data.playerId });
    } catch (problem) {
      setJoinError(problem instanceof Error ? problem.message : 'No se pudo entrar');
    } finally {
      setJoining(false);
    }
  }, [name, rememberIdentity, roomCode]);

  const view = useMemo(() => {
    if (!game) return null;
    const hits = game.masked.filter((letter): letter is string => letter !== null);
    const active = currentPlayer(game);
    return {
      hits: Array.from(new Set(hits)),
      active,
      myTurn: active !== null && active.id === playerId,
      finished: game.status === 'won' || game.status === 'lost',
    };
  }, [game, playerId]);

  if (!hydrated || (loading && !game)) {
    return <Centered>Cargando sala...</Centered>;
  }

  if (error && !game) {
    return (
      <Centered>
        <p className="text-coral">{error}</p>
        <Link href="/" className="btn-ghost mt-6">
          Volver al inicio
        </Link>
      </Centered>
    );
  }

  // Sin identidad en esta sala: primero hay que entrar con un nombre.
  if (playerId === null) {
    return (
      <main className="flex flex-1 flex-col justify-center gap-6 py-10 safe-bottom">
        <Logo />
        <div className="panel flex flex-col gap-5 p-5">
          <p className="text-center text-sm text-cream/55">
            Te han invitado a la sala{' '}
            <strong className="font-display tracking-[0.2em] text-honey">{roomCode}</strong>
          </p>
          <input
            className="field"
            placeholder="Tu nombre"
            maxLength={16}
            value={name}
            onChange={(event) => setName(event.target.value)}
            onKeyDown={(event) => event.key === 'Enter' && join()}
          />
          <button type="button" className="btn-primary w-full" onClick={join} disabled={joining}>
            {joining ? 'Entrando...' : 'Entrar a la partida'}
          </button>
          {joinError && <p className="text-center text-sm text-coral">{joinError}</p>}
          <Link href="/" className="text-center text-sm text-cream/40 hover:underline">
            Volver al inicio
          </Link>
        </div>
      </main>
    );
  }

  if (!game || !view) {
    return <Centered>Cargando sala...</Centered>;
  }

  // Aun no hay con quien jugar: mostramos el codigo bien grande para compartirlo.
  if (game.status === 'waiting') {
    return (
      <main className="flex flex-1 flex-col justify-center gap-6 py-10 safe-bottom">
        <Logo />
        <ShareRoom roomCode={roomCode} />
        <div className="panel flex flex-col items-center gap-4 p-6">
          <motion.span
            animate={{ opacity: [0.4, 1, 0.4] }}
            transition={{ duration: 1.8, repeat: Infinity }}
            className="font-display text-lg"
          >
            Esperando a que entre alguien más...
          </motion.span>
          <PlayersList
            players={game.players}
            turnIndex={game.turnIndex}
            myId={playerId}
            active={false}
          />
          <p className="text-xs text-cream/30">
            La partida arranca sola en cuanto seáis dos.
          </p>
        </div>
        <Link href="/" className="text-center text-sm text-cream/40 hover:underline">
          Salir de la sala
        </Link>
      </main>
    );
  }

  return (
    <main className="flex flex-1 flex-col gap-4 py-5">
      <header className="flex items-center justify-between">
        <Link href="/" className="text-sm text-cream/40 hover:text-cream/70">
          ← Salir
        </Link>
        <Logo compact />
        <span className="rounded-lg bg-white/[0.07] px-2.5 py-1 font-display text-sm font-semibold tracking-[0.12em] text-honey">{roomCode}</span>
      </header>

      <Board
        masked={game.masked}
        guessed={game.guessed}
        hits={view.hits}
        wrongCount={game.wrongCount}
        lost={game.status === 'lost'}
        disabled={!view.myTurn || view.finished}
        onGuess={guess}
        reveal={game.status === 'lost' ? game.word : null}
        banner={
          <div className="flex flex-col items-center gap-2">
            <PlayersList
              players={game.players}
              turnIndex={game.turnIndex}
              myId={playerId}
              active={game.status === 'playing'}
            />
            <motion.p
              key={view.myTurn ? 'me' : view.active?.id}
              initial={{ opacity: 0, y: -6 }}
              animate={{ opacity: 1, y: 0 }}
              className={`font-display text-lg ${view.myTurn ? 'text-honey' : 'text-cream/45'}`}
            >
              {view.myTurn ? '¡Te toca!' : `Turno de ${view.active?.name ?? '...'}`}
            </motion.p>
            {actionError && <p className="text-sm text-coral">{actionError}</p>}
          </div>
        }
      />

      <ResultOverlay
        status={view.finished ? (game.status as 'won' | 'lost') : null}
        word={game.word}
        actionLabel="Otra palabra"
        onAction={restart}
        secondary={
          <Link href="/" className="block text-sm text-cream/40 hover:underline">
            Salir de la sala
          </Link>
        }
      />
    </main>
  );
}

function Centered({ children }: { children: React.ReactNode }) {
  return (
    <main className="flex flex-1 flex-col items-center justify-center gap-2 py-10 text-center text-cream/50">
      {children}
    </main>
  );
}
