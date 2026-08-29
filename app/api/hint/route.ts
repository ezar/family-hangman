import { applyHint, normalizeRoomCode, type HintError } from '@/lib/gameLogic';
import { readGame, writeGame } from '@/lib/redis';
import { gameResponse, jsonError, readBody, serviceError } from '@/lib/api';

export const dynamic = 'force-dynamic';

const ERRORS: Record<HintError, { message: string; status: number }> = {
  'not-playing': { message: 'La partida no está en juego', status: 409 },
  'not-your-turn': { message: 'No es tu turno', status: 409 },
  'invalid-letter': { message: 'Letra no válida', status: 400 },
  'already-guessed': { message: 'Esa letra ya se ha probado', status: 409 },
  'unknown-player': { message: 'No estás en esta sala', status: 403 },
  'no-hints-left': { message: 'Ya habéis gastado la pista de esta ronda', status: 409 },
  'last-life': { message: 'Con una sola vida la pista no está disponible', status: 409 },
  'nothing-to-reveal': { message: 'No queda ninguna letra por descubrir', status: 409 },
  'hints-disabled': { message: 'El tramposo no da pistas', status: 409 },
};

export async function POST(request: Request) {
  const body = await readBody(request);
  const roomCode = normalizeRoomCode(body.room);
  if (!roomCode) return jsonError('Código de sala no válido', 400);

  const playerId = typeof body.playerId === 'number' ? body.playerId : null;
  if (playerId === null) return jsonError('Falta el jugador', 400);

  try {
    const game = await readGame(roomCode);
    if (!game) return jsonError('Esa sala no existe o ya ha caducado', 404);

    const result = applyHint(game, playerId);
    if (!result.ok) {
      const { message, status } = ERRORS[result.error];
      return jsonError(message, status);
    }

    await writeGame(result.game);
    return gameResponse(result.game, { letter: result.letter });
  } catch (error) {
    return serviceError(error);
  }
}
