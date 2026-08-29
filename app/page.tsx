'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { AnimatePresence, motion } from 'framer-motion';
import { LanguageProvider, useT } from '@/components/LanguageProvider';
import Logo from '@/components/Logo';
import { ChallengeIcon, GroupIcon, SoloIcon } from '@/components/ModeIcon';
import OptionsForm from '@/components/OptionsForm';
import Picker from '@/components/Picker';
import WordInput from '@/components/WordInput';
import { useGameStore } from '@/lib/gameStore';
import { useHydratedStore } from '@/lib/useHydratedStore';
import { localizeError } from '@/lib/apiError';
import { normalizeRoomCode } from '@/lib/gameLogic';

type Panel = 'menu' | 'group';

export default function HomePage() {
  const hydrated = useHydratedStore();
  const language = useGameStore((state) => state.language);

  // Antes de hidratar no sabemos el idioma guardado: el castellano por defecto
  // evita que el servidor y el navegador pinten cosas distintas.
  return (
    <LanguageProvider language={hydrated ? language : 'es'}>
      <Home hydrated={hydrated} />
    </LanguageProvider>
  );
}

function Home({ hydrated }: { hydrated: boolean }) {
  const t = useT();
  const router = useRouter();
  const { name, language, difficulty, setName, setLanguage, setDifficulty, rememberIdentity } =
    useGameStore();

  const [panel, setPanel] = useState<Panel>('menu');
  const [wordSource, setWordSource] = useState<'list' | 'player' | 'evil'>('list');
  const [code, setCode] = useState('');
  const [busy, setBusy] = useState<'create' | 'join' | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function call(path: string, body: unknown) {
    const response = await fetch(path, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    });
    const data = await response.json();
    if (!response.ok) throw new Error(localizeError(t, data, t.somethingWrong));
    return data as { game: { roomCode: string }; playerId: number };
  }

  async function createRoom(word?: string) {
    setBusy('create');
    setError(null);
    try {
      const data = await call('/api/create', { name, language, difficulty, wordSource, word });
      rememberIdentity({ roomCode: data.game.roomCode, playerId: data.playerId });
      router.push(`/room/${data.game.roomCode}`);
    } catch (problem) {
      setError(problem instanceof Error ? problem.message : t.somethingWrong);
      setBusy(null);
    }
  }

  async function joinRoom() {
    const roomCode = normalizeRoomCode(code);
    if (!roomCode) {
      setError(t.writeRoomCode);
      return;
    }

    setBusy('join');
    setError(null);
    try {
      const data = await call('/api/join', { room: roomCode, name });
      rememberIdentity({ roomCode, playerId: data.playerId });
      router.push(`/room/${roomCode}`);
    } catch (problem) {
      setError(problem instanceof Error ? problem.message : t.somethingWrong);
      setBusy(null);
    }
  }

  return (
    <main className="flex flex-1 flex-col justify-center gap-8 py-10 safe-bottom">
      <motion.div
        initial={{ opacity: 0, y: -16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ type: 'spring', stiffness: 200, damping: 20 }}
      >
        <Logo />
      </motion.div>

      <AnimatePresence mode="wait">
        {panel === 'menu' ? (
          <motion.div
            key="menu"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -12 }}
            transition={{ duration: 0.22 }}
            className="flex flex-col gap-4"
          >
            <ModeCard
              icon={<SoloIcon className="h-11 w-11 text-honey" />}
              title={t.playSolo}
              description={t.playSoloHint}
              accent="from-honey/30"
              onClick={() => router.push('/solo')}
            />
            <ModeCard
              icon={<GroupIcon className="h-11 w-11 text-grape" />}
              title={t.playGroup}
              description={t.playGroupHint}
              accent="from-grape/30"
              onClick={() => setPanel('group')}
            />
            <ModeCard
              icon={<ChallengeIcon className="h-11 w-11 text-coral" />}
              title={t.playChallenge}
              description={t.playChallengeHint}
              accent="from-coral/30"
              onClick={() => router.push('/reto')}
            />
          </motion.div>
        ) : (
          <motion.div
            key="group"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -12 }}
            transition={{ duration: 0.22 }}
            className="panel flex flex-col gap-5 p-5"
          >
            <div className="flex flex-col gap-2">
              <label className="label" htmlFor="player-name">
                {t.yourName}
              </label>
              <input
                id="player-name"
                className="field"
                placeholder={t.yourNamePlaceholder}
                maxLength={16}
                value={hydrated ? name : ''}
                onChange={(event) => setName(event.target.value)}
              />
            </div>

            <Picker
              label={t.theWord}
              layoutId="home-source"
              value={wordSource}
              onChange={setWordSource}
              options={[
                { value: 'list', label: t.wordRandom, hint: t.wordRandomHint },
                { value: 'player', label: t.wordMine, hint: t.wordMineHint },
                { value: 'evil', label: t.wordEvil, hint: t.wordEvilHint },
              ]}
            />

            {wordSource !== 'player' && (
              <OptionsForm
                idPrefix="home"
                language={language}
                difficulty={difficulty}
                onLanguage={setLanguage}
                onDifficulty={setDifficulty}
              />
            )}

            {wordSource === 'evil' && (
              <p className="rounded-xl border border-grape/30 bg-grape/10 px-4 py-3 text-center text-xs text-grape">
                {t.evilWarning}
              </p>
            )}

            {wordSource === 'player' ? (
              <WordInput
                label={t.yourSecretWord}
                submitLabel={t.createRoom}
                busy={busy === 'create'}
                onSubmit={(word) => createRoom(word)}
              />
            ) : (
              <button
                type="button"
                className="btn-primary w-full"
                onClick={() => createRoom()}
                disabled={busy !== null}
              >
                {busy === 'create' ? t.creatingRoom : t.createRoom}
              </button>
            )}

            <div className="flex items-center gap-3">
              <span className="h-px flex-1 bg-white/10" />
              <span className="label">{t.orJoin}</span>
              <span className="h-px flex-1 bg-white/10" />
            </div>

            <div className="flex gap-2">
              <input
                className="field flex-1 text-center uppercase tracking-[0.4em]"
                placeholder={t.codePlaceholder}
                maxLength={8}
                value={code}
                onChange={(event) => setCode(event.target.value.toUpperCase())}
                onKeyDown={(event) => event.key === 'Enter' && joinRoom()}
              />
              <button
                type="button"
                className="btn-ghost px-5"
                onClick={joinRoom}
                disabled={busy !== null}
              >
                {busy === 'join' ? '...' : t.enter}
              </button>
            </div>

            {error && (
              <p className="rounded-xl bg-coral/15 px-4 py-3 text-center text-sm text-coral">
                {error}
              </p>
            )}

            <button
              type="button"
              className="text-sm text-cream/40 underline-offset-4 hover:underline"
              onClick={() => setPanel('menu')}
            >
              {t.back}
            </button>
          </motion.div>
        )}
      </AnimatePresence>

      <ul className="flex items-center justify-center gap-2 text-[0.7rem] text-cream/30">
        {[t.featureNoInstall, t.featureLanguages, t.featureLevels].map((feature) => (
          <li key={feature} className="rounded-full border border-white/10 px-3 py-1.5">
            {feature}
          </li>
        ))}
      </ul>
    </main>
  );
}

function ModeCard({
  icon,
  title,
  description,
  accent,
  onClick,
}: {
  icon: React.ReactNode;
  title: string;
  description: string;
  accent: string;
  onClick: () => void;
}) {
  return (
    <motion.button
      type="button"
      onClick={onClick}
      whileTap={{ scale: 0.97 }}
      className={`panel group relative overflow-hidden p-6 text-left transition-colors hover:border-white/20`}
    >
      <span
        className={`pointer-events-none absolute -right-10 -top-10 h-40 w-40 rounded-full bg-gradient-to-br ${accent} to-transparent blur-2xl`}
      />
      <span className="relative flex items-center gap-4">
        <span className="grid h-16 w-16 shrink-0 place-items-center rounded-2xl border border-white/10 bg-black/25">
          {icon}
        </span>
        <span className="flex flex-col">
          <span className="font-display text-2xl font-semibold text-shadow-hard">{title}</span>
          <span className="text-sm text-cream/50">{description}</span>
        </span>
      </span>
    </motion.button>
  );
}
