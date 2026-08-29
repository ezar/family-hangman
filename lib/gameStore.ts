'use client';

import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
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
  setName: (name: string) => void;
  setLanguage: (language: Language) => void;
  setDifficulty: (difficulty: Difficulty) => void;
  rememberIdentity: (identity: RoomIdentity) => void;
  toggleSound: () => void;
  toggleVibration: () => void;
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
      setName: (name) => set({ name }),
      setLanguage: (language) => set({ language }),
      setDifficulty: (difficulty) => set({ difficulty }),
      rememberIdentity: ({ roomCode, playerId }) =>
        set((state) => ({ identities: { ...state.identities, [roomCode]: playerId } })),
      toggleSound: () => set((state) => ({ sound: !state.sound })),
      toggleVibration: () => set((state) => ({ vibration: !state.vibration })),
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
