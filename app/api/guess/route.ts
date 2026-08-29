import { applyEvilGuess } from '@/lib/evil';
import { applyGuess, normalizeRoomCode, type GuessError } from '@/lib/gameLogic';
import { wordList } from '@/lib/words';
import { readGame, writeGame } from '@/lib/redis';
import { gameResponse, jsonError, readBody, serviceError } from '@/lib/api';

export const dynamic = 'force-dynamic';

const ERRORS: Record<GuessError, { message: string; status: number }> = {
  'not-playing': { message: 'La partida no está en juego', status: 409 },
  'not-your-turn': { message: 'No es tu turno', status: 409 },
  'invalid-letter': { message: 'Letra no válida', status: 400 },
  'already-guessed': { message: 'Esa letra ya se ha probado', status: 409 },
  'unknown-player': { message: 'No estás en esta sala', status: 403 },
};

export async function POST(request: Request) {
  const body = await readBody(request);
  const roomCode = normalizeRoomCode(body.room);
  if (!roomCode) return jsonError('Código de sala no válido', 400, 'bad-code');

  const playerId = typeof body.playerId === 'number' ? body.playerId : null;
  if (playerId === null) return jsonError('Falta el jugador', 400);

  try {
    const game = await readGame(roomCode);
    if (!game) return jsonError('Esa sala no existe o ya ha caducado', 404, 'room-not-found');

    const letter = String(body.letter ?? '');
    const result =
      game.wordSource === 'evil'
        ? applyEvilGuess(game, playerId, letter, wordList(game.language, game.difficulty))
        : applyGuess(game, playerId, letter);
    if (!result.ok) {
      const { message, status } = ERRORS[result.error];
      return jsonError(message, status, result.error);
    }

    await writeGame(result.game);
    return gameResponse(result.game, { correct: result.correct, letter: result.letter });
  } catch (error) {
    return serviceError(error);
  }
}
