import { normalizeChallengeCode, rankResults, type PublicChallenge } from '@/lib/challenge';
import { readChallenge, readResults } from '@/lib/redis';
import { jsonError, serviceError } from '@/lib/api';
import { NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

export async function GET(request: Request) {
  const code = normalizeChallengeCode(new URL(request.url).searchParams.get('code'));
  if (!code) return jsonError('Código de reto no válido', 400, 'bad-code');

  try {
    const challenge = await readChallenge(code);
    if (!challenge) return jsonError('Ese reto no existe o ya ha caducado', 404, 'challenge-not-found');

    // Solo la longitud: la palabra no sale de aqui hasta que alguien termina.
    const info: PublicChallenge = {
      code: challenge.code,
      authorName: challenge.authorName,
      wordLength: challenge.word.length,
      results: rankResults(await readResults(code)),
    };
    return NextResponse.json({ challenge: info });
  } catch (error) {
    return serviceError(error);
  }
}
