import { normalizeAttemptId, normalizeChallengeCode, summarize } from './challenge';
import { toPublicGame } from './gameLogic';
import { pushResult, readAttempt, writeAttempt } from './redis';
import { jsonError, readBody } from './api';
import { NextResponse } from 'next/server';
import type { Game } from './types';

/**
 * Lo que comparten jugar una letra y pedir pista dentro de un reto: leer el
 * intento, aplicar la jugada y, si la partida termina ahi, apuntar el
 * resultado en la tabla del reto.
 */
export async function playAttempt(
  request: Request,
  apply: (
    game: Game,
    body: Record<string, unknown>,
  ) => { ok: true; game: Game; letter: string } | { ok: false; error: string },
  errors: Record<string, { message: string; status: number; code?: string }>,
) {
  const body = await readBody(request);
  const code = normalizeChallengeCode(body.code);
  const attemptId = normalizeAttemptId(body.attemptId);
  if (!code || !attemptId) return jsonError('Reto no válido', 400, 'bad-code');

  const game = await readAttempt(attemptId);
  if (!game) return jsonError('Esa partida ya no está disponible', 404, 'attempt-not-found');
  if (game.roomCode !== code) {
    return jsonError('Ese intento no es de este reto', 400, 'attempt-mismatch');
  }

  const result = apply(game, body);
  if (!result.ok) {
    const known = errors[result.error];
    return jsonError(
      known?.message ?? 'Jugada no válida',
      known?.status ?? 409,
      known?.code ?? result.error,
    );
  }

  await writeAttempt(attemptId, result.game);

  // La tabla del reto solo se toca una vez, al terminar el intento.
  const summary = summarize(result.game, result.game.players[0]?.name ?? 'Alguien');
  if (summary) await pushResult(code, summary);

  return NextResponse.json({ game: toPublicGame(result.game), letter: result.letter });
}

export const ATTEMPT_ERRORS: Record<
  string,
  { message: string; status: number; code?: string }
> = {
  // En un reto juegas solo, asi que "no esta en juego" quiere decir que tu
  // intento ya termino, no que la sala este parada.
  'not-playing': {
    message: 'Esta partida ya ha terminado',
    status: 409,
    code: 'attempt-finished',
  },
  'not-your-turn': { message: 'No es tu turno', status: 409 },
  'invalid-letter': { message: 'Letra no válida', status: 400 },
  'already-guessed': { message: 'Esa letra ya la has probado', status: 409 },
  'unknown-player': { message: 'Ese intento no es tuyo', status: 403, code: 'attempt-mismatch' },
  'no-hints-left': { message: 'Ya has gastado la pista', status: 409 },
  'last-life': { message: 'Con una sola vida la pista no está disponible', status: 409 },
  'nothing-to-reveal': { message: 'No queda ninguna letra por descubrir', status: 409 },
  'hints-disabled': { message: 'El tramposo no da pistas', status: 409 },
};
