/**
 * Ambiente de fondo: dos manchas de color que respiran despacio y una capa de
 * grano. Es puramente decorativo, asi que no lleva estado ni interaccion.
 */
export default function Backdrop() {
  return (
    <div className="grain pointer-events-none fixed inset-0 z-0 overflow-hidden" aria-hidden>
      <div className="absolute -left-24 -top-32 h-80 w-80 rounded-full bg-honey/40 blur-[80px] animate-aurora-drift" />
      <div
        className="absolute -right-28 top-1/3 h-96 w-96 rounded-full bg-grape/40 blur-[90px] animate-aurora-drift"
        style={{ animationDelay: '-6s' }}
      />
      <div
        className="absolute -bottom-24 left-1/4 h-72 w-72 rounded-full bg-coral/30 blur-[80px] animate-aurora-drift"
        style={{ animationDelay: '-12s' }}
      />
    </div>
  );
}
