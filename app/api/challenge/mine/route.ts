import { parseCodes, summarizeChallenge, type ChallengeSummary } from '@/lib/challenge';
import { readChallenge, readResults } from '@/lib/redis';
import { serviceError } from '@/lib/api';
import { NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

/**
 * Resumen de varios retos de una vez. El navegador guarda los codigos de los
 * que ha creado esta persona; aqui solo se traduce cada uno a "cuantos lo han
 * intentado". Los que ya han caducado no salen, y asi el cliente puede podar
 * su propia lista.
 */
export async function GET(request: Request) {
  const codes = parseCodes(new URL(request.url).searchParams.get('codes'));
  if (codes.length === 0) return NextResponse.json({ challenges: [] });

  try {
    const summaries = await Promise.all(
      codes.map(async (code): Promise<ChallengeSummary | null> => {
        const challenge = await readChallenge(code);
        if (!challenge) return null;
        return summarizeChallenge(challenge, await readResults(code));
      }),
    );

    const challenges = summaries
      .filter((summary): summary is ChallengeSummary => summary !== null)
      .sort((a, b) => b.createdAt - a.createdAt);

    return NextResponse.json({ challenges });
  } catch (error) {
    return serviceError(error);
  }
}
