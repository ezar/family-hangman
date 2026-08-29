'use client';

import { useCallback, useMemo, useState } from 'react';
import Link from 'next/link';
import { motion } from 'framer-motion';
import Board from '@/components/Board';
import EffectToggles from '@/components/EffectToggles';
import Logo from '@/components/Logo';
import OptionsForm from '@/components/OptionsForm';
import ResultOverlay from '@/components/ResultOverlay';
import Scoreboard from '@/components/Scoreboard';
import {
  applyGuess,
  applyHint,
  LIVES_BY_DIFFICULTY,
  MAX_HINTS,
  maskedWord,
  remainingLives,
} from '@/lib/gameLogic';
import { useGameStore } from '@/lib/gameStore';
import { useFeedback } from '@/lib/useFeedback';
import { useHydratedStore } from '@/lib/useHydratedStore';
import { randomWord, wordCount } from '@/lib/words';
import type { Game, Scores } from '@/lib/types';

const NO_SCORES: Scores = { wins: 0, losses: 0, streak: 0 };

/**
 * Modo solo: toda la partida vive en este componente. Reutiliza la misma
 * `applyGuess` que la API del modo grupal, pero sin tocar Redis ni la red.
 */
export default function SoloPage() {
  const hydrated = useHydratedStore();
  const { language, difficulty, setLanguage, setDifficulty } = useGameStore();
  const [game, setGame] = useState<Game | null>(null);
  const feedback = useFeedback();

  const start = useCallback(() => {
    setGame((current) => ({
      roomCode: 'SOLO',
      language,
      difficulty,
      status: 'playing',
      // Al pedir otra palabra, nunca repetimos la que se acaba de jugar.
      word: randomWord(language, difficulty, current?.word),
      guessed: [],
      wrongCount: 0,
      maxWrong: LIVES_BY_DIFFICULTY[difficulty],
      turnIndex: 0,
      players: [{ id: 1, name: 'Tu' }],
      nextId: 2,
      wordSource: 'list',
      setterId: null,
      hintsUsed: 0,
      // El marcador sobrevive a la ronda: es lo que hace que apetezca otra.
      scores: current?.scores ?? { ...NO_SCORES },
    }));
  }, [language, difficulty]);

  const guess = useCallback(
    (letter: string) => {
      setGame((current) => {
        if (!current) return current;
        const result = applyGuess(current, 1, letter);
        if (!result.ok) return current;
        feedback(
          result.game.status === 'won'
            ? 'win'
            : result.game.status === 'lost'
              ? 'lose'
              : result.correct
                ? 'hit'
                : 'miss',
        );
        return result.game;
      });
    },
    [feedback],
  );

  const hint = useCallback(() => {
    setGame((current) => {
      if (!current) return current;
      const result = applyHint(current, 1);
      if (!result.ok) return current;
      feedback(result.game.status === 'won' ? 'win' : 'hint');
      return result.game;
    });
  }, [feedback]);

  const view = useMemo(() => {
    if (!game) return null;
    return {
      masked: maskedWord(game.word, game.guessed),
      hits: game.guessed.filter((letter) => game.word.includes(letter)),
      hintAvailable:
        game.status === 'playing' && game.hintsUsed < MAX_HINTS && remainingLives(game) > 1,
    };
  }, [game]);

  if (!game || !view) {
    return (
      <main className="flex flex-1 flex-col justify-center gap-8 py-10 safe-bottom">
        <Logo />
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="panel flex flex-col gap-5 p-5"
        >
          <p className="text-center text-sm text-cream/50">
            Elige con qué palabras quieres jugar.
          </p>

          <OptionsForm
            idPrefix="solo"
            language={language}
            difficulty={difficulty}
            onLanguage={setLanguage}
            onDifficulty={setDifficulty}
          />

          <p className="text-center text-xs text-cream/30">
            {hydrated
              ? `${wordCount(language, difficulty)} palabras · ${LIVES_BY_DIFFICULTY[difficulty]} vidas`
              : ' '}
          </p>

          <button type="button" className="btn-primary w-full" onClick={start}>
            Empezar
          </button>
          <Link href="/" className="text-center text-sm text-cream/40 hover:underline">
            Volver al inicio
          </Link>
        </motion.div>
      </main>
    );
  }

  const finished = game.status === 'won' || game.status === 'lost' ? game.status : null;

  return (
    <main className="flex flex-1 flex-col gap-3 py-4">
      <header className="flex items-center justify-between gap-2">
        <Link href="/" className="text-sm text-cream/40 hover:text-cream/70">
          ← Inicio
        </Link>
        <Logo compact />
        <div className="flex items-center gap-1">
          <EffectToggles hydrated={hydrated} />
          <button
            type="button"
            onClick={() => setGame(null)}
            className="px-1 text-sm text-cream/40 hover:text-cream/70"
          >
            Ajustes
          </button>
        </div>
      </header>

      <Board
        masked={view.masked}
        guessed={game.guessed}
        hits={view.hits}
        wrongCount={game.wrongCount}
        maxWrong={game.maxWrong}
        lost={game.status === 'lost'}
        disabled={finished !== null}
        onGuess={guess}
        onHint={hint}
        hintAvailable={view.hintAvailable}
        reveal={game.status === 'lost' ? game.word : null}
        banner={<Scoreboard scores={game.scores} />}
      />

      <ResultOverlay
        status={finished}
        word={finished ? game.word : null}
        actionLabel="Otra palabra"
        winTitle="¡Ganaste!"
        onAction={start}
        scores={game.scores}
        secondary={
          <Link href="/" className="block text-sm text-cream/40 hover:underline">
            Volver al inicio
          </Link>
        }
      />
    </main>
  );
}
