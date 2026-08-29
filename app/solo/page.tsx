'use client';

import { useCallback, useMemo, useState } from 'react';
import Link from 'next/link';
import { motion } from 'framer-motion';
import Board from '@/components/Board';
import Logo from '@/components/Logo';
import OptionsForm from '@/components/OptionsForm';
import ResultOverlay from '@/components/ResultOverlay';
import { applyGuess, maskedWord } from '@/lib/gameLogic';
import { useGameStore } from '@/lib/gameStore';
import { useHydratedStore } from '@/lib/useHydratedStore';
import { randomWord, wordCount } from '@/lib/words';
import type { Game } from '@/lib/types';

/**
 * Modo solo: toda la partida vive en este componente. Reutiliza la misma
 * `applyGuess` que la API del modo grupal, pero sin tocar Redis ni la red.
 */
export default function SoloPage() {
  const hydrated = useHydratedStore();
  const { language, difficulty, setLanguage, setDifficulty } = useGameStore();
  const [game, setGame] = useState<Game | null>(null);

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
      turnIndex: 0,
      players: [{ id: 1, name: 'Tu' }],
      nextId: 2,
    }));
  }, [language, difficulty]);

  const guess = useCallback((letter: string) => {
    setGame((current) => {
      if (!current) return current;
      const result = applyGuess(current, 1, letter);
      return result.ok ? result.game : current;
    });
  }, []);

  const view = useMemo(() => {
    if (!game) return null;
    const hits = game.guessed.filter((letter) => game.word.includes(letter));
    return { masked: maskedWord(game.word, game.guessed), hits };
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
            {hydrated ? `${wordCount(language, difficulty)} palabras en esta lista` : ' '}
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
    <main className="flex flex-1 flex-col gap-4 py-5">
      <header className="flex items-center justify-between">
        <Link href="/" className="text-sm text-cream/40 hover:text-cream/70">
          ← Inicio
        </Link>
        <Logo compact />
        <button
          type="button"
          onClick={() => setGame(null)}
          className="text-sm text-cream/40 hover:text-cream/70"
        >
          Ajustes
        </button>
      </header>

      <Board
        masked={view.masked}
        guessed={game.guessed}
        hits={view.hits}
        wrongCount={game.wrongCount}
        lost={game.status === 'lost'}
        disabled={finished !== null}
        onGuess={guess}
        reveal={game.status === 'lost' ? game.word : null}
        banner={
          <p className="text-center text-sm text-cream/40">
            {game.language === 'es' ? 'Español' : 'English'} · {game.difficulty}
          </p>
        }
      />

      <ResultOverlay
        status={finished}
        word={finished ? game.word : null}
        actionLabel="Otra palabra"
        winTitle="¡Ganaste!"
        onAction={start}
        secondary={
          <Link href="/" className="block text-sm text-cream/40 hover:underline">
            Volver al inicio
          </Link>
        }
      />
    </main>
  );
}
