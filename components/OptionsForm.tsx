'use client';

import Picker from './Picker';
import { useT } from './LanguageProvider';
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
  const t = useT();

  return (
    <div className="flex flex-col gap-4">
      <Picker
        label={t.language}
        layoutId={`${idPrefix}-language`}
        value={language}
        onChange={onLanguage}
        options={[
          { value: 'es', label: t.spanish },
          { value: 'en', label: t.english },
        ]}
      />
      <Picker
        label={t.difficulty}
        layoutId={`${idPrefix}-difficulty`}
        value={difficulty}
        onChange={onDifficulty}
        options={[
          { value: 'infantil', label: t.levelKids, hint: t.levelKidsHint },
          { value: 'familiar', label: t.levelFamily, hint: t.levelFamilyHint },
          { value: 'experto', label: t.levelExpert, hint: t.levelExpertHint },
        ]}
      />
    </div>
  );
}
