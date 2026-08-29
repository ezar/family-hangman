'use client';

import { useState } from 'react';
import { MAX_CUSTOM_WORD, MIN_CUSTOM_WORD, normalizeCustomWord } from '@/lib/gameLogic';

interface Props {
  label: string;
  submitLabel: string;
  onSubmit: (word: string) => void | Promise<unknown>;
  busy?: boolean;
}

/**
 * Campo para escribir la palabra que otros tendran que adivinar. Valida con la
 * misma funcion que el servidor, para que el aviso llegue antes de enviar.
 */
export default function WordInput({ label, submitLabel, onSubmit, busy = false }: Props) {
  const [raw, setRaw] = useState('');
  const [touched, setTouched] = useState(false);

  const clean = normalizeCustomWord(raw);
  const problem = touched && raw.trim() !== '' && !clean;

  async function submit() {
    setTouched(true);
    if (clean) await onSubmit(clean);
  }

  return (
    <div className="flex flex-col gap-2">
      <label className="label" htmlFor="custom-word">
        {label}
      </label>
      <input
        id="custom-word"
        type="text"
        autoComplete="off"
        autoCapitalize="none"
        spellCheck={false}
        className="field text-center uppercase tracking-[0.15em]"
        placeholder="TU PALABRA"
        maxLength={MAX_CUSTOM_WORD + 4}
        value={raw}
        onChange={(event) => setRaw(event.target.value)}
        onBlur={() => setTouched(true)}
        onKeyDown={(event) => event.key === 'Enter' && submit()}
      />
      <p className={`text-center text-xs ${problem ? 'text-coral' : 'text-cream/30'}`}>
        {problem
          ? `Entre ${MIN_CUSTOM_WORD} y ${MAX_CUSTOM_WORD} letras, una sola palabra`
          : 'Las tildes y la eñe se ajustan solas'}
      </p>
      <button
        type="button"
        className="btn-primary w-full"
        onClick={submit}
        disabled={busy || !clean}
      >
        {busy ? 'Enviando...' : submitLabel}
      </button>
    </div>
  );
}
