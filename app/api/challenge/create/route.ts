import { generateChallengeCode, type Challenge } from '@/lib/challenge';
import { normalizeCustomWord } from '@/lib/gameLogic';
import { createChallengeIfAbsent } from '@/lib/redis';
import { messagesFor } from '@/lib/i18n';
import { isLanguage } from '@/lib/types';
import { cleanName, jsonError, readBody, serviceError } from '@/lib/api';
import { NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

export async function POST(request: Request) {
  const body = await readBody(request);
  const word = normalizeCustomWord(body.word);
  if (!word) {
    return jsonError('La palabra debe tener entre 3 y 20 letras, sin espacios ni números', 400, 'bad-word');
  }

  const language = isLanguage(body.language) ? body.language : 'es';
  const authorName = cleanName(body.name, messagesFor(language).someone);

  try {
    for (let attempt = 0; attempt < 6; attempt += 1) {
      const challenge: Challenge = {
        code: generateChallengeCode(),
        word,
        authorName,
        createdAt: Date.now(),
      };
      if (await createChallengeIfAbsent(challenge)) {
        return NextResponse.json({ code: challenge.code, wordLength: word.length });
      }
    }
    return jsonError('No se pudo generar un código libre, inténtalo otra vez', 503);
  } catch (error) {
    return serviceError(error);
  }
}
