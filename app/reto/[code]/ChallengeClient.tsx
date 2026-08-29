'use client';

import { useCallback, useEffect, useState } from 'react';
import Link from 'next/link';
import { motion } from 'framer-motion';
import Board from '@/components/Board';
import EffectToggles from '@/components/EffectToggles';
import { LanguageProvider, useLanguage, useT } from '@/components/LanguageProvider';
import Logo from '@/components/Logo';
import ResultOverlay from '@/components/ResultOverlay';
import ResultsTable from '@/components/ResultsTable';
import ShareLink from '@/components/ShareLink';
import { MAX_HINTS, remainingLives } from '@/lib/gameLogic';
import { useGameStore } from '@/lib/gameStore';
import { useFeedback } from '@/lib/useFeedback';
import { localizeError } from '@/lib/apiError';
import { useHydratedStore } from '@/lib/useHydratedStore';
import { useRecordGame } from '@/lib/useRecordGame';
import type { PublicChallenge } from '@/lib/challenge';
import type { PublicGame } from '@/lib/types';

export default function ChallengeClient({ code }: { code: string }) {
  const hydrated = useHydratedStore();
  const language = useGameStore((state) => state.language);

  // Un reto no tiene idioma propio: la palabra la escribe una persona, no sale
  // de una lista. Cada quien lo lee en el suyo.
  return (
    <LanguageProvider language={hydrated ? language : 'es'}>
      <Challenge code={code} hydrated={hydrated} />
    </LanguageProvider>
  );
}

function Challenge({ code, hydrated }: { code: string; hydrated: boolean }) {
  const t = useT();
  const language = useLanguage();
  const { name, setName, attempts, rememberAttempt, myChallenges } = useGameStore();

  const [challenge, setChallenge] = useState<PublicChallenge | null>(null);
  const [game, setGame] = useState<PublicGame | null>(null);
  // El tablero se puede cerrar sin perder la partida: al terminar se vuelve a
  // la portada, que es donde esta la tabla.
  const [showBoard, setShowBoard] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const feedback = useFeedback();

  const attemptId = hydrated ? (attempts[code] ?? null) : null;
  const mine = hydrated && myChallenges.includes(code);

  // Un intento es unico, asi que sirve de identidad de la ronda.
  useRecordGame('challenge', code, attemptId ?? 'sin-intento', game, {
    language,
    code,
    author: challenge?.authorName,
  });

  const loadChallenge = useCallback(async () => {
    try {
      const response = await fetch(`/api/challenge/info?code=${encodeURIComponent(code)}`);
      const data = await response.json();
      if (!response.ok) throw new Error(localizeError(t, data, t.somethingWrong));
      setChallenge(data.challenge);
    } catch (problem) {
      setError(problem instanceof Error ? problem.message : t.somethingWrong);
    }
  }, [code, t]);

  useEffect(() => {
    loadChallenge();
  }, [loadChallenge]);

  // Si ya habias abierto este reto, recuperamos tu intento: para retomarlo si
  // quedo a medias, y para ensenarte tu resultado si ya lo terminaste, en vez
  // de dejarte empezar otro y salir dos veces en la tabla.
  useEffect(() => {
    if (!attemptId) return;
    let cancelled = false;

    (async () => {
      try {
        const response = await fetch(
          `/api/challenge/attempt?code=${encodeURIComponent(code)}&attemptId=${encodeURIComponent(attemptId)}`,
        );
        const data = await response.json();
        if (cancelled || !response.ok) return;

        const previous = data.game as PublicGame;
        setGame(previous);
        setShowBoard(previous.status === 'playing');
      } catch {
        // Sin intento recuperable se juega como si fuera la primera vez.
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [attemptId, code]);

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
        if (!response.ok) throw new Error(localizeError(t, data, t.somethingWrong));

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
        setError(problem instanceof Error ? problem.message : t.somethingWrong);
      }
    },
    [attemptId, code, feedback, loadChallenge, t],
  );

  async function start() {
    setBusy(true);
    setError(null);
    try {
      const response = await fetch('/api/challenge/start', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ code, name, language }),
      });
      const data = await response.json();
      if (!response.ok) throw new Error(localizeError(t, data, t.somethingWrong));
      rememberAttempt(code, data.attemptId);
      setGame(data.game);
      setShowBoard(true);
    } catch (problem) {
      setError(problem instanceof Error ? problem.message : t.somethingWrong);
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
              {t.backHome}
            </Link>
          </>
        ) : (
          <p className="text-cream/50">{t.loadingChallenge}</p>
        )}
      </main>
    );
  }

  const finishedMine =
    game && (game.status === 'won' || game.status === 'lost') ? game : null;

  // Antes de jugar (o si el reto es mio): la portada con la tabla de resultados.
  if (!showBoard || !game) {
    return (
      <main className="flex flex-1 flex-col justify-center gap-5 py-8 safe-bottom">
        <Logo />

        <motion.div
          initial={{ opacity: 0, y: 18 }}
          animate={{ opacity: 1, y: 0 }}
          className="panel flex flex-col gap-4 p-5 text-center"
        >
          <p className="font-display text-2xl leading-tight">
            {mine ? t.yourChallenge : t.challengesYou(challenge.authorName)}
          </p>
          <p className="text-sm text-cream/50">
            {t.aWordOf}{' '}
            <strong className="font-display text-lg text-honey">{challenge.wordLength}</strong>{' '}
            {t.wordOfLetters}
          </p>

          {/* Ya lo jugaste: tu resultado, y sin opcion de repetir. */}
          {!mine && finishedMine && (
            <div
              className={`rounded-2xl border px-4 py-3 ${
                finishedMine.status === 'won'
                  ? 'border-mint/30 bg-mint/10'
                  : 'border-coral/30 bg-coral/10'
              }`}
            >
              <p className="label mb-1">{t.alreadyPlayed}</p>
              <p
                className={`font-display text-base ${
                  finishedMine.status === 'won' ? 'text-mint' : 'text-coral'
                }`}
              >
                {finishedMine.status === 'won'
                  ? t.yourResultWon(finishedMine.wrongCount)
                  : t.yourResultLost}
              </p>
              {finishedMine.word && (
                <p className="mt-1 text-xs text-cream/45">
                  {t.theWordWas}{' '}
                  <strong className="font-display uppercase tracking-wide text-cream/80">
                    {finishedMine.word}
                  </strong>
                </p>
              )}
            </div>
          )}

          {/* A medias: se retoma donde lo dejaste, no se empieza de cero. */}
          {!mine && game && game.status === 'playing' && (
            <button type="button" className="btn-primary w-full" onClick={() => setShowBoard(true)}>
              {t.resumeGame}
            </button>
          )}

          {!mine && !game && (
            <>
              <input
                className="field text-center"
                placeholder={t.yourName}
                maxLength={16}
                value={hydrated ? name : ''}
                onChange={(event) => setName(event.target.value)}
              />
              <button type="button" className="btn-primary w-full" onClick={start} disabled={busy}>
                {busy ? t.preparing : t.acceptChallenge}
              </button>
            </>
          )}

          {mine && (
            <ShareLink
              path={`/reto/${code}`}
              text={t.challengeText(challenge.wordLength)}
              label={t.shareAgain}
            />
          )}

          {error && <p className="text-sm text-coral">{error}</p>}
        </motion.div>

        <div className="panel flex flex-col gap-3 p-5">
          <p className="label text-center">{t.whoTriedIt}</p>
          <ResultsTable results={challenge.results} />
        </div>

        <div className="flex flex-col gap-2 text-center">
          <Link href="/reto" className="text-sm text-honey/70 hover:underline">
            {t.createMyChallenge}
          </Link>
          <Link href="/" className="text-sm text-cream/40 hover:underline">
            {t.backHome}
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
          ← {t.leave}
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
              {t.theWordOf(challenge.authorName)}
            </p>
            {error && <p className="text-sm text-coral">{error}</p>}
          </div>
        }
      />

      <ResultOverlay
        status={finished}
        word={game.word}
        winTitle={t.youGuessedIt}
        onAction={undefined}
        secondary={
          <div className="flex flex-col gap-3">
            {/* El bucle se cierra aqui: quien acaba de jugar crea el suyo. */}
            <Link href="/reto" className="btn-ghost w-full">
              {t.challengeNowYou}
            </Link>
            {/*
              Un enlace a esta misma pagina no navega a ningun sitio: el cartel
              no vive en la URL sino en el estado, asi que hay que cerrarlo.
            */}
            <button
              type="button"
              onClick={() => setShowBoard(false)}
              className="text-sm text-cream/40 hover:underline"
            >
              {t.seeChallengeTable}
            </button>
          </div>
        }
      />
    </main>
  );
}
