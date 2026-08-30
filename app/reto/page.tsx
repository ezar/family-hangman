'use client';

import { useState } from 'react';
import Link from 'next/link';
import { motion } from 'framer-motion';
import { LanguageProvider, useLanguage, useT } from '@/components/LanguageProvider';
import Logo from '@/components/Logo';
import Picker from '@/components/Picker';
import ShareLink from '@/components/ShareLink';
import WordInput from '@/components/WordInput';
import { useGameStore } from '@/lib/gameStore';
import { localizeError } from '@/lib/apiError';
import { useHydratedStore } from '@/lib/useHydratedStore';
import type { Language } from '@/lib/types';

/**
 * Crear un reto: escribes una palabra y te llevas un enlace. No hay sala ni
 * espera; cada persona que lo abra jugara tu palabra por su cuenta.
 */
export default function NewChallengePage() {
  const hydrated = useHydratedStore();
  const language = useGameStore((state) => state.language);

  return (
    <LanguageProvider language={hydrated ? language : 'es'}>
      <NewChallenge hydrated={hydrated} />
    </LanguageProvider>
  );
}

function NewChallenge({ hydrated }: { hydrated: boolean }) {
  const t = useT();
  const language = useLanguage();
  const { name, setName, rememberChallenge } = useGameStore();
  const [created, setCreated] = useState<{
    code: string;
    wordLength: number;
    language: Language;
  } | null>(null);
  // El idioma de la palabra, que no tiene por que ser el de la pantalla.
  const [wordLanguage, setWordLanguage] = useState<Language>(language);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function create(word: string) {
    setBusy(true);
    setError(null);
    try {
      const response = await fetch('/api/challenge/create', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ word, name, language, wordLanguage }),
      });
      const data = await response.json();
      if (!response.ok) throw new Error(localizeError(t, data, t.somethingWrong));
      rememberChallenge(data.code);
      setCreated({ code: data.code, wordLength: data.wordLength, language: data.language });
    } catch (problem) {
      setError(problem instanceof Error ? problem.message : t.somethingWrong);
    } finally {
      setBusy(false);
    }
  }

  if (created) {
    return (
      <main className="flex flex-1 flex-col justify-center gap-6 py-10 safe-bottom">
        <Logo />
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          className="panel flex flex-col gap-5 p-6 text-center"
        >
          <div className="text-5xl">🎯</div>
          <p className="font-display text-2xl">{t.challengeReady}</p>
          <p className="text-sm text-cream/50">
            {t.challengeReadyHint(created.wordLength, t.inLanguage[created.language])}
          </p>

          <ShareLink
            path={`/reto/${created.code}`}
            text={t.challengeText(created.wordLength, t.inLanguage[created.language])}
            label={t.shareChallenge}
          />

          <Link
            href={`/reto/${created.code}`}
            className="text-sm text-cream/50 underline-offset-4 hover:underline"
          >
            {t.seeWhoTried}
          </Link>
          <Link href="/" className="text-sm text-cream/40 hover:underline">
            {t.backHome}
          </Link>
        </motion.div>
      </main>
    );
  }

  return (
    <main className="flex flex-1 flex-col justify-center gap-6 py-10 safe-bottom">
      <Logo />
      <motion.div
        initial={{ opacity: 0, y: 18 }}
        animate={{ opacity: 1, y: 0 }}
        className="panel flex flex-col gap-5 p-5"
      >
        <p className="text-center text-sm text-cream/55">{t.challengeIntro}</p>

        <div className="flex flex-col gap-2">
          <label className="label" htmlFor="author-name">
            {t.yourName}
          </label>
          <input
            id="author-name"
            className="field"
            placeholder={t.whoChallenges}
            maxLength={16}
            value={hydrated ? name : ''}
            onChange={(event) => setName(event.target.value)}
          />
        </div>

        {/* Quien recibe el enlace no sabe en que idioma pensar si no se le dice. */}
        <Picker
          label={t.wordLanguage}
          layoutId="challenge-word-language"
          value={wordLanguage}
          onChange={setWordLanguage}
          options={[
            { value: 'es', label: t.spanish },
            { value: 'en', label: t.english },
          ]}
        />

        <WordInput
          label={t.wordToGuess}
          submitLabel={t.createChallenge}
          busy={busy}
          onSubmit={create}
        />

        {error && (
          <p className="rounded-xl bg-coral/15 px-4 py-3 text-center text-sm text-coral">{error}</p>
        )}

        <Link href="/" className="text-center text-sm text-cream/40 hover:underline">
          {t.backHome}
        </Link>
      </motion.div>
    </main>
  );
}
