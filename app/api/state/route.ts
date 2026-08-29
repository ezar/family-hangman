import { normalizeRoomCode } from '@/lib/gameLogic';
import { readGame } from '@/lib/redis';
import { gameResponse, jsonError, serviceError } from '@/lib/api';

export const dynamic = 'force-dynamic';

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const roomCode = normalizeRoomCode(searchParams.get('room'));
  if (!roomCode) return jsonError('Código de sala no válido', 400);

  try {
    const game = await readGame(roomCode);
    if (!game) return jsonError('Esa sala no existe o ya ha caducado', 404);
    return gameResponse(game);
  } catch (error) {
    return serviceError(error);
  }
}
