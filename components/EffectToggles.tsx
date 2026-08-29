'use client';

import { useGameStore } from '@/lib/gameStore';
import { useT } from './LanguageProvider';

/** Sonido y vibracion, cada uno por su lado: el movil puede estar en silencio. */
export default function EffectToggles({ hydrated }: { hydrated: boolean }) {
  const t = useT();
  const { sound, vibration, toggleSound, toggleVibration } = useGameStore();

  const buttons = [
    {
      on: hydrated ? sound : true,
      toggle: toggleSound,
      label: t.sound,
      path: 'M11 5 6 9H3v6h3l5 4V5Z',
      extra: 'M15.5 8.5a5 5 0 0 1 0 7M18.5 5.5a9 9 0 0 1 0 13',
    },
    {
      on: hydrated ? vibration : true,
      toggle: toggleVibration,
      label: t.vibration,
      path: 'M8 3h8a1 1 0 0 1 1 1v16a1 1 0 0 1-1 1H8a1 1 0 0 1-1-1V4a1 1 0 0 1 1-1Z',
      extra: 'M3 9v6M21 9v6',
    },
  ];

  return (
    <div className="flex items-center gap-1">
      {buttons.map((button) => (
        <button
          key={button.label}
          type="button"
          onClick={button.toggle}
          aria-pressed={button.on}
          aria-label={`${button.label}: ${button.on ? t.on : t.off}`}
          className={`grid h-9 w-9 place-items-center rounded-xl border transition-colors ${
            button.on
              ? 'border-white/15 bg-white/[0.08] text-cream'
              : 'border-white/5 bg-transparent text-cream/25'
          }`}
        >
          <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="1.9" strokeLinecap="round" strokeLinejoin="round">
            <path d={button.path} />
            <path d={button.extra} />
            {!button.on && <path d="M3 3l18 18" className="text-coral" stroke="currentColor" />}
          </svg>
        </button>
      ))}
    </div>
  );
}
