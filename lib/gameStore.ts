'use client';

import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import { MAX_OWN_CHALLENGES } from './challenge';
import { addEntry, type HistoryEntry } from './history';
import type { Difficulty, Language } from './types';

interface RoomIdentity {
  roomCode: string;
  playerId: number;
}

interface GameState {
  /** Nombre con el que entro a las salas; se recuerda entre partidas. */
  name: string;
  /** Preferencias con las que se abre el selector la proxima vez. */
  language: Language;
  difficulty: Difficulty;
  /** Mi id de jugador en cada sala en la que he entrado. */
  identities: Record<string, number>;
  /** Efectos: se pueden apagar por separado (movil en silencio, por ejemplo). */
  sound: boolean;
  vibration: boolean;
  /** Mi intento en cada reto, para que recargar no lo pierda. */
  attempts: Record<string, string>;
  /** Retos que he creado yo, para volver a ver quien ha picado. */
  myChallenges: string[];
  /** Partidas terminadas en este dispositivo, de la mas reciente a la mas vieja. */
  history: HistoryEntry[];
  setName: (name: string) => void;
  setLanguage: (language: Language) => void;
  setDifficulty: (difficulty: Difficulty) => void;
  rememberIdentity: (identity: RoomIdentity) => void;
  toggleSound: () => void;
  toggleVibration: () => void;
  rememberAttempt: (code: string, attemptId: string) => void;
  rememberChallenge: (code: string) => void;
  forgetChallenges: (codes: string[]) => void;
  recordGame: (entry: HistoryEntry) => void;
  clearHistory: () => void;
  playerIdFor: (roomCode: string) => number | null;
}

export const useGameStore = create<GameState>()(
  persist(
    (set, get) => ({
      name: '',
      language: 'es',
      difficulty: 'familiar',
      identities: {},
      sound: true,
      vibration: true,
      attempts: {},
      myChallenges: [],
      history: [],
      setName: (name) => set({ name }),
      setLanguage: (language) => set({ language }),
      setDifficulty: (difficulty) => set({ difficulty }),
      rememberIdentity: ({ roomCode, playerId }) =>
        set((state) => ({ identities: { ...state.identities, [roomCode]: playerId } })),
      toggleSound: () => set((state) => ({ sound: !state.sound })),
      toggleVibration: () => set((state) => ({ vibration: !state.vibration })),
      rememberAttempt: (code, attemptId) =>
        set((state) => ({ attempts: { ...state.attempts, [code]: attemptId } })),
      rememberChallenge: (code) =>
        set((state) => ({
          myChallenges: [code, ...state.myChallenges.filter((c) => c !== code)].slice(
            0,
            MAX_OWN_CHALLENGES,
          ),
        })),
      recordGame: (entry) => set((state) => ({ history: addEntry(state.history, entry) })),
      clearHistory: () => set({ history: [] }),
      // Los retos caducan a los siete dias: cuando el servidor ya no los
      // conoce, se quitan de la lista para que no queden enlaces muertos.
      forgetChallenges: (codes) =>
        set((state) => ({
          myChallenges: state.myChallenges.filter((code) => !codes.includes(code)),
        })),
      playerIdFor: (roomCode) => get().identities[roomCode] ?? null,
    }),
    {
      name: 'family-hangman',
      storage: createJSONStorage(() => localStorage),
      // El estado persistido solo existe en el navegador: hidratamos a mano
      // desde los componentes para no romper el render del servidor.
      skipHydration: true,
    },
  ),
);
