import { attemptGame, newAttemptId, normalizeChallengeCode } from '@/lib/challenge';
import { toPublicGame } from '@/lib/gameLogic';
import { readChallenge, writeAttempt } from '@/lib/redis';
import { cleanName, jsonError, readBody, serviceError } from '@/lib/api';
import { NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

export async function POST(request: Request) {
  const body = await readBody(request);
  const code = normalizeChallengeCode(body.code);
  if (!code) return jsonError('Código de reto no válido', 400);

  try {
    const challenge = await readChallenge(code);
    if (!challenge) return jsonError('Ese reto no existe o ya ha caducado', 404);

    // Cada persona que abre el enlace juega su propio intento, en paralelo.
    const id = newAttemptId();
    const game = attemptGame(challenge, cleanName(body.name));
    await writeAttempt(id, game);

    return NextResponse.json({ attemptId: id, game: toPublicGame(game) });
  } catch (error) {
    return serviceError(error);
  }
}
