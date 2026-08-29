import { createGame, generateRoomCode } from '@/lib/gameLogic';
import { createGameIfAbsent } from '@/lib/redis';
import { isDifficulty, isLanguage } from '@/lib/types';
import { randomWord } from '@/lib/words';
import { cleanName, gameResponse, jsonError, readBody, serviceError } from '@/lib/api';

export const dynamic = 'force-dynamic';

export async function POST(request: Request) {
  const body = await readBody(request);
  const language = isLanguage(body.language) ? body.language : 'es';
  const difficulty = isDifficulty(body.difficulty) ? body.difficulty : 'familiar';
  const hostName = cleanName(body.name);

  try {
    // Codigos de 4 caracteres chocan de vez en cuando: reintentamos con NX.
    for (let attempt = 0; attempt < 6; attempt += 1) {
      const game = createGame({
        roomCode: generateRoomCode(),
        language,
        difficulty,
        word: randomWord(language, difficulty),
        hostName,
      });

      if (await createGameIfAbsent(game)) {
        return gameResponse(game, { playerId: game.players[0].id });
      }
    }
    return jsonError('No se pudo generar un código de sala libre, inténtalo otra vez', 503);
  } catch (error) {
    return serviceError(error);
  }
}
