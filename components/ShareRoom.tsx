'use client';

import { useState } from 'react';

/** Codigo grande + copiar/compartir: es lo unico que hay que pasarle al resto. */
export default function ShareRoom({ roomCode }: { roomCode: string }) {
  const [copied, setCopied] = useState(false);

  async function share() {
    const url = `${window.location.origin}/room/${roomCode}`;
    const text = `Juega al ahorcado conmigo. Sala ${roomCode}: ${url}`;

    if (navigator.share) {
      try {
        await navigator.share({ title: 'Ahorcado en Familia', text, url });
        return;
      } catch {
        // Compartir cancelado: seguimos con el portapapeles.
      }
    }

    try {
      await navigator.clipboard.writeText(url);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      setCopied(false);
    }
  }

  return (
    <button
      type="button"
      onClick={share}
      className="panel flex w-full items-center justify-between gap-4 p-4 text-left transition-colors hover:border-white/20"
    >
      <span className="flex flex-col gap-2">
        <span className="label">Código de sala</span>
        {/* En fichas, igual que las letras del juego: la sala se lee de un vistazo. */}
        <span className="flex gap-1.5">
          {roomCode.split('').map((character, index) => (
            <span
              key={index}
              className="grid h-11 w-9 place-items-center rounded-lg bg-gradient-to-b from-honey
                         to-honey-deep font-display text-2xl font-bold text-ink shadow-key-sm"
            >
              {character}
            </span>
          ))}
        </span>
      </span>
      <span className="rounded-xl bg-white/[0.08] px-4 py-3 font-display text-sm">
        {copied ? '¡Copiado!' : 'Compartir'}
      </span>
    </button>
  );
}
