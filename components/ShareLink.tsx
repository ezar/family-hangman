'use client';

import { useState } from 'react';
import { useT } from './LanguageProvider';

interface Props {
  /** Ruta relativa, para poder montar la URL absoluta ya en el navegador. */
  path: string;
  text: string;
  label: string;
}

/** Compartir nativo si lo hay, portapapeles si no. */
export default function ShareLink({ path, text, label }: Props) {
  const t = useT();
  const [copied, setCopied] = useState(false);

  async function share() {
    const url = `${window.location.origin}${path}`;

    if (navigator.share) {
      try {
        await navigator.share({ title: t.appName, text, url });
        return;
      } catch {
        // Compartir cancelado: seguimos con el portapapeles.
      }
    }

    try {
      await navigator.clipboard.writeText(`${text} ${url}`);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      setCopied(false);
    }
  }

  return (
    <button type="button" onClick={share} className="btn-primary w-full">
      {copied ? t.linkCopied : label}
    </button>
  );
}
