'use client';

import { useCallback, useEffect, useState } from 'react';
import Link from 'next/link';
import { motion } from 'framer-motion';
import Board from '@/components/Board';
import EffectToggles from '@/components/EffectToggles';
import Logo from '@/components/Logo';
import ResultOverlay from '@/components/ResultOverlay';
import ResultsTable from '@/components/ResultsTable';
import ShareLink from '@/components/ShareLink';
import { MAX_HINTS, remainingLives } from '@/lib/gameLogic';
import { useGameStore } from '@/lib/gameStore';
import { useFeedback } from '@/lib/useFeedback';
import { useHydratedStore } from '@/lib/useHydratedStore';
import type { PublicChallenge } from '@/lib/challenge';
import type { PublicGame } from '@/lib/types';

export default function ChallengeClient({ code }: { code: string }) {
  const hydrated = useHydratedStore();
  const { name, setName, attempts, rememberAttempt, myChallenges } = useGameStore();

  const [challenge, setChallenge] = useState<PublicChallenge | null>(null);
  const [game, setGame] = useState<PublicGame | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const feedback = useFeedback();

  const attemptId = hydrated ? (attempts[code] ?? null) : null;
  const mine = hydrated && myChallenges.includes(code);

  const loadChallenge = useCallback(async () => {
    try {
      const response = await fetch(`/api/challenge/info?code=${encodeURIComponent(code)}`);
      const data = await response.json();
      if (!response.ok) throw new Error(data.error ?? 'No se pudo cargar el reto');
      setChallenge(data.challenge);
    } catch (problem) {
      setError(problem instanceof Error ? problem.message : 'No se pudo cargar el reto');
    }
  }, [code]);

  useEffect(() => {
    loadChallenge();
  }, [loadChallenge]);

  const play = useCallback(
    async (path: string, body: Record<string, unknown>) => {
      setError(null);
      try {
        const response = await fetch(path, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ code, attemptId, ...body }),
        });
        const data = await response.json();
        if (!response.ok) throw new Error(data.error ?? 'No se pudo jugar');

        const next = data.game as PublicGame;
        setGame((current) => {
          if (current) {
            feedback(
              next.status === 'won'
                ? 'win'
                : next.status === 'lost'
                  ? 'lose'
                  : next.wrongCount > current.wrongCount
                    ? 'miss'
                    : 'hit',
            );
          }
          return next;
        });
        // Al terminar, la tabla ya tiene una fila mas.
        if (next.status === 'won' || next.status === 'lost') void loadChallenge();
      } catch (problem) {
        setError(problem instanceof Error ? problem.message : 'No se pudo jugar');
      }
    },
    [attemptId, code, feedback, loadChallenge],
  );

  async function start() {
    setBusy(true);
    setError(null);
    try {
      const response = await fetch('/api/challenge/start', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ code, name }),
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error ?? 'No se pudo empezar');
      rememberAttempt(code, data.attemptId);
      setGame(data.game);
    } catch (problem) {
      setError(problem instanceof Error ? problem.message : 'No se pudo empezar');
    } finally {
      setBusy(false);
    }
  }

  if (!challenge) {
    return (
      <main className="flex flex-1 flex-col items-center justify-center gap-4 py-10 text-center">
        {error ? (
          <>
            <p className="text-coral">{error}</p>
            <Link href="/" className="btn-ghost">
              Volver al inicio
            </Link>
          </>
        ) : (
          <p className="text-cream/50">Cargando el reto...</p>
        )}
      </main>
    );
  }

  // Antes de jugar (o si el reto es mio): la portada con la tabla de resultados.
  if (!game) {
    return (
      <main className="flex flex-1 flex-col justify-center gap-5 py-8 safe-bottom">
        <Logo />

        <motion.div
          initial={{ opacity: 0, y: 18 }}
          animate={{ opacity: 1, y: 0 }}
          className="panel flex flex-col gap-4 p-5 text-center"
        >
          <p className="font-display text-2xl leading-tight">
            {mine ? 'Tu reto' : `${challenge.authorName} te reta`}
          </p>
          <p className="text-sm text-cream/50">
            Una palabra de{' '}
            <strong className="font-display text-lg text-honey">{challenge.wordLength}</strong>{' '}
            letras.
          </p>

          {!mine && (
            <>
              <input
                className="field text-center"
                placeholder="Tu nombre"
                maxLength={16}
                value={hydrated ? name : ''}
                onChange={(event) => setName(event.target.value)}
              />
              <button type="button" className="btn-primary w-full" onClick={start} disabled={busy}>
                {busy ? 'Preparando...' : 'Aceptar el reto'}
              </button>
            </>
          )}

          {mine && (
            <ShareLink
              path={`/reto/${code}`}
              text={`Te reto: adivina mi palabra de ${challenge.wordLength} letras.`}
              label="Compartir otra vez"
            />
          )}

          {error && <p className="text-sm text-coral">{error}</p>}
        </motion.div>

        <div className="panel flex flex-col gap-3 p-5">
          <p className="label text-center">Quién lo ha intentado</p>
          <ResultsTable results={challenge.results} />
        </div>

        <div className="flex flex-col gap-2 text-center">
          <Link href="/reto" className="text-sm text-honey/70 hover:underline">
            Crear mi propio reto
          </Link>
          <Link href="/" className="text-sm text-cream/40 hover:underline">
            Volver al inicio
          </Link>
        </div>
      </main>
    );
  }

  const finished = game.status === 'won' || game.status === 'lost' ? game.status : null;
  const hits = Array.from(new Set(game.masked.filter((l): l is string => l !== null)));

  return (
    <main className="flex flex-1 flex-col gap-3 py-4">
      <header className="flex items-center justify-between gap-2">
        <Link href="/" className="text-sm text-cream/40 hover:text-cream/70">
          ← Salir
        </Link>
        <Logo compact />
        <EffectToggles hydrated={hydrated} />
      </header>

      <Board
        masked={game.masked}
        guessed={game.guessed}
        hits={hits}
        wrongCount={game.wrongCount}
        maxWrong={game.maxWrong}
        lost={game.status === 'lost'}
        disabled={finished !== null}
        onGuess={(letter) => play('/api/challenge/guess', { letter })}
        onHint={() => play('/api/challenge/hint', {})}
        hintAvailable={
          game.status === 'playing' && game.hintsUsed < MAX_HINTS && remainingLives(game) > 1
        }
        reveal={game.status === 'lost' ? game.word : null}
        banner={
          <div className="flex flex-col items-center gap-1">
            <p className="text-center text-sm text-cream/45">
              La palabra de {challenge.authorName}
            </p>
            {error && <p className="text-sm text-coral">{error}</p>}
          </div>
        }
      />

      <ResultOverlay
        status={finished}
        word={game.word}
        winTitle="¡Lo adivinaste!"
        onAction={undefined}
        secondary={
          <div className="flex flex-col gap-3">
            {/* El bucle se cierra aqui: quien acaba de jugar crea el suyo. */}
            <Link href="/reto" className="btn-ghost w-full">
              Ahora reta tú
            </Link>
            <Link href={`/reto/${code}`} className="text-sm text-cream/40 hover:underline">
              Ver la tabla del reto
            </Link>
          </div>
        }
      />
    </main>
  );
}
