import { evilStart } from '@/lib/evil';
import { createGame, generateRoomCode, normalizeCustomWord } from '@/lib/gameLogic';
import { createGameIfAbsent } from '@/lib/redis';
import { isDifficulty, isLanguage } from '@/lib/types';
import { randomWord, wordList } from '@/lib/words';
import { cleanName, gameResponse, jsonError, readBody, serviceError } from '@/lib/api';

export const dynamic = 'force-dynamic';

export async function POST(request: Request) {
  const body = await readBody(request);
  const language = isLanguage(body.language) ? body.language : 'es';
  const difficulty = isDifficulty(body.difficulty) ? body.difficulty : 'familiar';
  const hostName = cleanName(body.name);
  const wordSource =
    body.wordSource === 'player' || body.wordSource === 'evil' ? body.wordSource : 'list';

  let word: string;
  let candidatesLeft: number | undefined;

  if (wordSource === 'player') {
    // En una sala de palabra propia, quien crea la sala la escribe al vuelo.
    const custom = normalizeCustomWord(body.word);
    if (!custom) {
      return jsonError('La palabra debe tener entre 3 y 20 letras, sin espacios ni números', 400);
    }
    word = custom;
  } else if (wordSource === 'evil') {
    const start = evilStart(wordList(language, difficulty));
    if (!start) {
      return jsonError('Esa lista no tiene palabras suficientes para el modo tramposo', 400);
    }
    word = start.word;
    candidatesLeft = start.candidatesLeft;
  } else {
    word = randomWord(language, difficulty);
  }

  try {
    // Codigos de 4 caracteres chocan de vez en cuando: reintentamos con NX.
    for (let attempt = 0; attempt < 6; attempt += 1) {
      const game = {
        ...createGame({
          roomCode: generateRoomCode(),
          language,
          difficulty,
          word,
          hostName,
          wordSource,
        }),
        candidatesLeft,
      };

      if (await createGameIfAbsent(game)) {
        return gameResponse(game, { playerId: game.players[0].id });
      }
    }
    return jsonError('No se pudo generar un código de sala libre, inténtalo otra vez', 503);
  } catch (error) {
    return serviceError(error);
  }
}
