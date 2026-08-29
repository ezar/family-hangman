import { MAX_WRONG } from '@/lib/gameLogic';

/** Seis corazones: el marcador de fallos, legible de un vistazo desde lejos. */
export default function LivesMeter({ wrongCount }: { wrongCount: number }) {
  return (
    <div className="flex items-center gap-1.5" aria-label={`Vidas: ${MAX_WRONG - wrongCount}`}>
      {Array.from({ length: MAX_WRONG }, (_, index) => {
        // Las vidas restantes se agrupan a la izquierda; se apagan por la derecha.
        const lost = index >= MAX_WRONG - wrongCount;
        return (
          <svg
            key={index}
            viewBox="0 0 24 24"
            className={`h-4 w-4 transition-all duration-300 ${
              lost ? 'scale-90 text-cream/15' : 'text-coral drop-shadow-[0_0_6px_rgba(255,107,107,0.55)]'
            }`}
            fill="currentColor"
            aria-hidden
          >
            <path d="M12 21s-7.5-4.7-9.4-9A5.3 5.3 0 0 1 12 6.6 5.3 5.3 0 0 1 21.4 12c-1.9 4.3-9.4 9-9.4 9Z" />
          </svg>
        );
      })}
    </div>
  );
}
