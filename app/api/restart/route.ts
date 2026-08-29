import { normalizeRoomCode, restartGame } from '@/lib/gameLogic';
import { readGame, writeGame } from '@/lib/redis';
import { randomWord } from '@/lib/words';
import { gameResponse, jsonError, readBody, serviceError } from '@/lib/api';

export const dynamic = 'force-dynamic';

export async function POST(request: Request) {
  const body = await readBody(request);
  const roomCode = normalizeRoomCode(body.room);
  if (!roomCode) return jsonError('Código de sala no válido', 400);

  try {
    const game = await readGame(roomCode);
    if (!game) return jsonError('Esa sala no existe o ya ha caducado', 404);

    if (game.status === 'playing') {
      return jsonError('La partida sigue en juego', 409);
    }

    // Misma sala, mismo idioma y dificultad: solo cambia la palabra.
    const next = restartGame(game, randomWord(game.language, game.difficulty, game.word));
    await writeGame(next);
    return gameResponse(next);
  } catch (error) {
    return serviceError(error);
  }
}
