import { NextResponse } from 'next/server';
import { toPublicGame } from './gameLogic';
import type { Game } from './types';

export function jsonError(message: string, status: number) {
  return NextResponse.json({ error: message }, { status });
}

export function gameResponse(game: Game, extra: Record<string, unknown> = {}) {
  return NextResponse.json({ game: toPublicGame(game), ...extra });
}

export async function readBody(request: Request): Promise<Record<string, unknown>> {
  try {
    const body = await request.json();
    return body && typeof body === 'object' ? (body as Record<string, unknown>) : {};
  } catch {
    return {};
  }
}

/** Nombre de jugador saneado: recortado y limitado, nunca vacio. */
export function cleanName(input: unknown, fallback = 'Jugador'): string {
  const name = typeof input === 'string' ? input.trim().replace(/\s+/g, ' ') : '';
  return (name || fallback).slice(0, 16);
}

/** Convierte el fallo de Redis por falta de credenciales en un 503 claro. */
export function serviceError(error: unknown) {
  const message = error instanceof Error ? error.message : 'Error inesperado';
  console.error('[family-hangman]', message);
  return jsonError(
    message.includes('UPSTASH') ? message : 'No se pudo conectar con la sala',
    503,
  );
}

export const MAX_PLAYERS = 8;
