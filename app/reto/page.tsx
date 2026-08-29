'use client';

import { useState } from 'react';
import Link from 'next/link';
import { motion } from 'framer-motion';
import Logo from '@/components/Logo';
import ShareLink from '@/components/ShareLink';
import WordInput from '@/components/WordInput';
import { useGameStore } from '@/lib/gameStore';
import { useHydratedStore } from '@/lib/useHydratedStore';

/**
 * Crear un reto: escribes una palabra y te llevas un enlace. No hay sala ni
 * espera; cada persona que lo abra jugara tu palabra por su cuenta.
 */
export default function NewChallengePage() {
  const hydrated = useHydratedStore();
  const { name, setName, rememberChallenge } = useGameStore();
  const [created, setCreated] = useState<{ code: string; wordLength: number } | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function create(word: string) {
    setBusy(true);
    setError(null);
    try {
      const response = await fetch('/api/challenge/create', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ word, name }),
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error ?? 'No se pudo crear el reto');
      rememberChallenge(data.code);
      setCreated({ code: data.code, wordLength: data.wordLength });
    } catch (problem) {
      setError(problem instanceof Error ? problem.message : 'No se pudo crear el reto');
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
          <p className="font-display text-2xl">Reto listo</p>
          <p className="text-sm text-cream/50">
            Tu palabra tiene {created.wordLength} letras. Pásale el enlace a quien quieras: no
            hace falta que esté conectado ahora, ni que se instale nada.
          </p>

          <ShareLink
            path={`/reto/${created.code}`}
            text={`Te reto: adivina mi palabra de ${created.wordLength} letras.`}
            label="Compartir el reto"
          />

          <Link
            href={`/reto/${created.code}`}
            className="text-sm text-cream/50 underline-offset-4 hover:underline"
          >
            Ver quién lo ha intentado
          </Link>
          <Link href="/" className="text-sm text-cream/40 hover:underline">
            Volver al inicio
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
        <p className="text-center text-sm text-cream/55">
          Escribe una palabra y te damos un enlace para retar a quien quieras.
        </p>

        <div className="flex flex-col gap-2">
          <label className="label" htmlFor="author-name">
            Tu nombre
          </label>
          <input
            id="author-name"
            className="field"
            placeholder="¿Quién reta?"
            maxLength={16}
            value={hydrated ? name : ''}
            onChange={(event) => setName(event.target.value)}
          />
        </div>

        <WordInput
          label="La palabra que tendrán que adivinar"
          submitLabel="Crear el reto"
          busy={busy}
          onSubmit={create}
        />

        {error && (
          <p className="rounded-xl bg-coral/15 px-4 py-3 text-center text-sm text-coral">{error}</p>
        )}

        <Link href="/" className="text-center text-sm text-cream/40 hover:underline">
          Volver al inicio
        </Link>
      </motion.div>
    </main>
  );
}
