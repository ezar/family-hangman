import type { Messages } from './i18n';

/**
 * La API responde con un codigo y un texto en castellano. Si conocemos el
 * codigo lo traducimos al idioma de la pantalla; si no, mostramos el texto tal
 * cual, que siempre es mejor que un mensaje generico.
 */
export function localizeError(
  t: Messages,
  data: { error?: unknown; code?: unknown },
  fallback: string,
): string {
  if (typeof data.code === 'string') {
    const translated = t[`error.${data.code}` as keyof Messages];
    if (typeof translated === 'string') return translated;
  }
  return typeof data.error === 'string' && data.error ? data.error : fallback;
}
