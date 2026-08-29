'use client';

import { useEffect, useState } from 'react';
import { useGameStore } from './gameStore';

/**
 * El store persiste en localStorage, que no existe en el servidor. Hidratamos
 * despues del primer render y devolvemos si ya se puede confiar en sus valores.
 */
export function useHydratedStore(): boolean {
  const [hydrated, setHydrated] = useState(false);

  useEffect(() => {
    useGameStore.persist.rehydrate();
    setHydrated(true);
  }, []);

  return hydrated;
}
