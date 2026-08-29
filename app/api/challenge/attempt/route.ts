import { normalizeAttemptId, normalizeChallengeCode } from '@/lib/challenge';
import { toPublicGame } from '@/lib/gameLogic';
import { readAttempt } from '@/lib/redis';
import { jsonError, serviceError } from '@/lib/api';
import { NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

/**
 * El intento de quien ya abrio este reto: sirve para retomar una partida a
 * medias tras recargar, y para ensenar su resultado a quien ya lo jugo en vez
 * de dejarle empezar otra y salir dos veces en la tabla.
 */
export async function GET(request: Request) {
  const params = new URL(request.url).searchParams;
  const code = normalizeChallengeCode(params.get('code'));
  const attemptId = normalizeAttemptId(params.get('attemptId'));
  if (!code || !attemptId) return jsonError('Reto no válido', 400, 'bad-code');

  try {
    const game = await readAttempt(attemptId);
    if (!game) return jsonError('Esa partida ya no está disponible', 404, 'attempt-not-found');
    if (game.roomCode !== code) {
      return jsonError('Ese intento no es de este reto', 400, 'attempt-mismatch');
    }

    return NextResponse.json({ game: toPublicGame(game) });
  } catch (error) {
    return serviceError(error);
  }
}
