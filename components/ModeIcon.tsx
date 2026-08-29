/** Iconos propios en SVG: los emoji se pintan distinto en cada movil. */
export function SoloIcon({ className = '' }: { className?: string }) {
  return (
    <svg viewBox="0 0 48 48" className={className} fill="none" aria-hidden>
      <circle cx="24" cy="24" r="18" stroke="currentColor" strokeWidth="3" opacity="0.35" />
      <circle cx="24" cy="24" r="11" stroke="currentColor" strokeWidth="3" opacity="0.6" />
      <circle cx="24" cy="24" r="4.5" fill="currentColor" />
    </svg>
  );
}

export function GroupIcon({ className = '' }: { className?: string }) {
  return (
    <svg viewBox="0 0 48 48" className={className} fill="none" aria-hidden>
      <circle cx="17" cy="17" r="7" stroke="currentColor" strokeWidth="3" />
      <circle cx="33" cy="20" r="5.5" stroke="currentColor" strokeWidth="3" opacity="0.55" />
      <path
        d="M6 39c0-6.6 5-11 11-11s11 4.4 11 11"
        stroke="currentColor"
        strokeWidth="3"
        strokeLinecap="round"
      />
      <path
        d="M31 30c6 0 11 3.8 11 9"
        stroke="currentColor"
        strokeWidth="3"
        strokeLinecap="round"
        opacity="0.55"
      />
    </svg>
  );
}

export function ChallengeIcon({ className = '' }: { className?: string }) {
  return (
    <svg viewBox="0 0 48 48" className={className} fill="none" aria-hidden>
      <path
        d="M8 10h32v22H20l-8 7v-7H8z"
        stroke="currentColor"
        strokeWidth="3"
        strokeLinejoin="round"
      />
      <path d="M18 21h2M23 21h2M28 21h2" stroke="currentColor" strokeWidth="3.4" strokeLinecap="round" />
    </svg>
  );
}
