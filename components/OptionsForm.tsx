'use client';

import Picker from './Picker';
import type { Difficulty, Language } from '@/lib/types';

interface Props {
  language: Language;
  difficulty: Difficulty;
  onLanguage: (language: Language) => void;
  onDifficulty: (difficulty: Difficulty) => void;
  idPrefix: string;
}

/** Idioma + dificultad: los dos ajustes que definen de que lista sale la palabra. */
export default function OptionsForm({
  language,
  difficulty,
  onLanguage,
  onDifficulty,
  idPrefix,
}: Props) {
  return (
    <div className="flex flex-col gap-4">
      <Picker
        label="Idioma"
        layoutId={`${idPrefix}-language`}
        value={language}
        onChange={onLanguage}
        options={[
          { value: 'es', label: 'Español' },
          { value: 'en', label: 'English' },
        ]}
      />
      <Picker
        label="Dificultad"
        layoutId={`${idPrefix}-difficulty`}
        value={difficulty}
        onChange={onDifficulty}
        options={[
          { value: 'infantil', label: 'Infantil', hint: 'cortas' },
          { value: 'familiar', label: 'Familiar', hint: 'media' },
          { value: 'experto', label: 'Experto', hint: 'largas' },
        ]}
      />
    </div>
  );
}
