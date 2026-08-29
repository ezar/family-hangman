import { addPlayer, normalizeRoomCode } from '@/lib/gameLogic';
import { readGame, writeGame } from '@/lib/redis';
import { cleanName, gameResponse, jsonError, MAX_PLAYERS, readBody, serviceError } from '@/lib/api';

export const dynamic = 'force-dynamic';

export async function POST(request: Request) {
  const body = await readBody(request);
  const roomCode = normalizeRoomCode(body.room);
  if (!roomCode) return jsonError('Código de sala no válido', 400);

  const name = cleanName(body.name);

  try {
    const game = await readGame(roomCode);
    if (!game) return jsonError('Esa sala no existe o ya ha caducado', 404);

    // Volver a entrar con el mismo id (por ejemplo tras recargar) no duplica jugador.
    const existingId = typeof body.playerId === 'number' ? body.playerId : null;
    if (existingId !== null && game.players.some((player) => player.id === existingId)) {
      return gameResponse(game, { playerId: existingId });
    }

    if (game.players.length >= MAX_PLAYERS) {
      return jsonError(`La sala está completa (${MAX_PLAYERS} jugadores)`, 409);
    }

    const { game: next, player } = addPlayer(game, name);
    await writeGame(next);
    return gameResponse(next, { playerId: player.id });
  } catch (error) {
    return serviceError(error);
  }
}
