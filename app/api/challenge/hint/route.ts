import { applyHint } from '@/lib/gameLogic';
import { ATTEMPT_ERRORS, playAttempt } from '@/lib/attemptPlay';
import { serviceError } from '@/lib/api';

export const dynamic = 'force-dynamic';

export async function POST(request: Request) {
  try {
    return await playAttempt(request, (game) => applyHint(game, 1), ATTEMPT_ERRORS);
  } catch (error) {
    return serviceError(error);
  }
}
