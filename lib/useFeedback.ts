'use client';

import { useCallback } from 'react';
import { useGameStore } from './gameStore';

export type Cue = 'hit' | 'miss' | 'hint' | 'win' | 'lose';

/**
 * Tonos sintetizados en el momento: no hay archivos de audio que descargar,
 * asi que suenan al instante y no pesan nada. Cada nota es
 * [frecuencia en Hz, momento en segundos, duracion].
 */
const NOTES: Record<Cue, [number, number, number][]> = {
  hit: [[880, 0, 0.12]],
  miss: [[180, 0, 0.18]],
  hint: [[660, 0, 0.08], [990, 0.08, 0.12]],
  win: [
    [523, 0, 0.12],
    [659, 0.12, 0.12],
    [784, 0.24, 0.12],
    [1047, 0.36, 0.26],
  ],
  lose: [
    [392, 0, 0.16],
    [311, 0.16, 0.16],
    [233, 0.32, 0.34],
  ],
};

/** Patrones de vibracion, en milisegundos (vibra / pausa / vibra...). */
const BUZZ: Record<Cue, number | number[]> = {
  hit: 14,
  miss: [40, 60, 40],
  hint: 18,
  win: [30, 50, 30, 50, 90],
  lose: [90, 70, 160],
};

let context: AudioContext | null = null;

/** El navegador solo deja crear el contexto tras un gesto del usuario. */
function getContext(): AudioContext | null {
  if (typeof window === 'undefined') return null;
  const Ctor = window.AudioContext ?? (window as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
  if (!Ctor) return null;
  if (!context) context = new Ctor();
  if (context.state === 'suspended') void context.resume();
  return context;
}

export function useFeedback() {
  const sound = useGameStore((state) => state.sound);
  const vibration = useGameStore((state) => state.vibration);

  return useCallback(
    (cue: Cue) => {
      if (sound) {
        const ctx = getContext();
        if (ctx) {
          for (const [frequency, at, duration] of NOTES[cue]) {
            const oscillator = ctx.createOscillator();
            const gain = ctx.createGain();
            oscillator.type = cue === 'miss' || cue === 'lose' ? 'sawtooth' : 'triangle';
            oscillator.frequency.value = frequency;
            // Envolvente corta: sin ella cada nota suena a chasquido.
            const start = ctx.currentTime + at;
            gain.gain.setValueAtTime(0.0001, start);
            gain.gain.exponentialRampToValueAtTime(0.18, start + 0.012);
            gain.gain.exponentialRampToValueAtTime(0.0001, start + duration);
            oscillator.connect(gain).connect(ctx.destination);
            oscillator.start(start);
            oscillator.stop(start + duration + 0.02);
          }
        }
      }

      if (vibration && typeof navigator !== 'undefined' && navigator.vibrate) {
        navigator.vibrate(BUZZ[cue]);
      }
    },
    [sound, vibration],
  );
}
