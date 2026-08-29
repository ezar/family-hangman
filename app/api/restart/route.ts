import { normalizeCustomWord, normalizeRoomCode, restartGame } from '@/lib/gameLogic';
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

    let word: string;
    if (game.wordSource === 'player') {
      // Solo quien pone la palabra puede abrir la ronda siguiente, y tiene
      // que traer una nueva: nadie mas conoce ni elige la palabra.
      const playerId = typeof body.playerId === 'number' ? body.playerId : null;
      if (playerId !== game.setterId) {
        return jsonError('Solo quien pone la palabra puede empezar otra ronda', 403);
      }
      const custom = normalizeCustomWord(body.word);
      if (!custom) {
        return jsonError('La palabra debe tener entre 3 y 20 letras, sin espacios ni numeros', 400);
      }
      word = custom;
    } else {
      // Misma sala, mismo idioma y dificultad: solo cambia la palabra.
      word = randomWord(game.language, game.difficulty, game.word);
    }

    const next = restartGame(game, word);
    await writeGame(next);
    return gameResponse(next);
  } catch (error) {
    return serviceError(error);
  }
}
