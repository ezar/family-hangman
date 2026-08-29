'use client';

import { createContext, useContext, useEffect, useMemo } from 'react';
import { messagesFor, type Messages } from '@/lib/i18n';
import type { Language } from '@/lib/types';

interface Value {
  language: Language;
  t: Messages;
}

/** Sin proveedor se habla castellano, que es el idioma por defecto del juego. */
const LanguageContext = createContext<Value>({ language: 'es', t: messagesFor('es') });

export function LanguageProvider({
  language,
  children,
}: {
  language: Language;
  children: React.ReactNode;
}) {
  const value = useMemo(() => ({ language, t: messagesFor(language) }), [language]);

  // El atributo lang del documento importa para lectores de pantalla y para el
  // corrector del navegador, y solo aqui sabemos el idioma de esta pantalla.
  useEffect(() => {
    document.documentElement.lang = language;
  }, [language]);

  return <LanguageContext.Provider value={value}>{children}</LanguageContext.Provider>;
}

/** Los textos de la pantalla actual. */
export function useT(): Messages {
  return useContext(LanguageContext).t;
}

export function useLanguage(): Language {
  return useContext(LanguageContext).language;
}
