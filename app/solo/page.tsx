'use client';

import { useCallback, useMemo, useState } from 'react';
import Link from 'next/link';
import { motion } from 'framer-motion';
import Board from '@/components/Board';
import CandidateCount from '@/components/CandidateCount';
import EffectToggles from '@/components/EffectToggles';
import Logo from '@/components/Logo';
import OptionsForm from '@/components/OptionsForm';
import ResultOverlay from '@/components/ResultOverlay';
import Scoreboard from '@/components/Scoreboard';
import { applyEvilGuess, evilStart } from '@/lib/evil';
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
import { randomWord, wordCount, wordList } from '@/lib/words';
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
  const [evil, setEvil] = useState(false);
  const feedback = useFeedback();

  const start = useCallback(() => {
    // En modo tramposo no se elige palabra: solo un representante de todas las
    // que siguen encajando, que ira cambiando segun preguntes.
    const started = evil ? evilStart(wordList(language, difficulty)) : null;

    setGame((current) => ({
      roomCode: 'SOLO',
      language,
      difficulty,
      status: 'playing',
      // Al pedir otra palabra, nunca repetimos la que se acaba de jugar.
      word: started?.word ?? randomWord(language, difficulty, current?.word),
      guessed: [],
      wrongCount: 0,
      maxWrong: LIVES_BY_DIFFICULTY[difficulty],
      turnIndex: 0,
      players: [{ id: 1, name: 'Tu' }],
      nextId: 2,
      wordSource: evil ? 'evil' : 'list',
      setterId: null,
      hintsUsed: 0,
      candidatesLeft: started?.candidatesLeft,
      // El marcador sobrevive a la ronda: es lo que hace que apetezca otra.
      scores: current?.scores ?? { ...NO_SCORES },
    }));
  }, [language, difficulty, evil]);

  const guess = useCallback(
    (letter: string) => {
      setGame((current) => {
        if (!current) return current;
        const result =
          current.wordSource === 'evil'
            ? applyEvilGuess(current, 1, letter, wordList(current.language, current.difficulty))
            : applyGuess(current, 1, letter);
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
        game.status === 'playing' &&
        game.wordSource !== 'evil' &&
        game.hintsUsed < MAX_HINTS &&
        remainingLives(game) > 1,
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

          {/* El tramposo es un modo, no un nivel: se apila sobre la lista elegida. */}
          <button
            type="button"
            onClick={() => setEvil((on) => !on)}
            aria-pressed={evil}
            className={`flex items-center gap-3 rounded-2xl border p-3.5 text-left transition-colors ${
              evil ? 'border-grape/50 bg-grape/15' : 'border-white/10 bg-black/20'
            }`}
          >
            <span
              className={`grid h-9 w-9 shrink-0 place-items-center rounded-xl text-lg ${
                evil ? 'bg-grape/30' : 'bg-white/5 grayscale'
              }`}
            >
              🎭
            </span>
            <span className="flex flex-col">
              <span className="font-display text-base font-semibold">Modo tramposo</span>
              <span className="text-xs leading-tight text-cream/40">
                No elige palabra: te esquiva mientras pueda
              </span>
            </span>
          </button>

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
        onHint={game.wordSource === 'evil' ? null : hint}
        hintAvailable={view.hintAvailable}
        reveal={game.status === 'lost' ? game.word : null}
        banner={
          <div className="flex flex-col items-center gap-1.5">
            <Scoreboard scores={game.scores} />
            <CandidateCount count={game.candidatesLeft} />
          </div>
        }
      />

      <ResultOverlay
        status={finished}
        word={finished ? game.word : null}
        actionLabel="Otra palabra"
        winTitle="¡Ganaste!"
        onAction={start}
        scores={game.scores}
        evil={game.wordSource === 'evil'}
        secondary={
          <Link href="/" className="block text-sm text-cream/40 hover:underline">
            Volver al inicio
          </Link>
        }
      />
    </main>
  );
}
