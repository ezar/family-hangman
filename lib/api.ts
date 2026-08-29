import { NextResponse } from 'next/server';
import { toPublicGame } from './gameLogic';
import type { Game } from './types';

/**
 * Los errores viajan con un codigo ademas del texto. El servidor no sabe en
 * que idioma esta mirando quien recibe la respuesta, asi que el cliente
 * traduce el codigo y el texto queda solo como respaldo.
 */
export function jsonError(message: string, status: number, code?: string) {
  return NextResponse.json({ error: message, code }, { status });
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

/**
 * Nombre de jugador saneado: recortado y limitado, nunca vacio. El respaldo
 * depende del idioma porque acaba escrito en la pantalla de todos.
 */
export function cleanName(input: unknown, fallback = 'Jugador'): string {
  const name = typeof input === 'string' ? input.trim().replace(/\s+/g, ' ') : '';
  return (name || fallback).slice(0, 16);
}

/** Convierte el fallo de Redis por falta de credenciales en un 503 claro. */
export function serviceError(error: unknown) {
  const message = error instanceof Error ? error.message : 'Error inesperado';
  console.error('[family-hangman]', message);
  return jsonError(
    message.includes('UPSTASH') || message.includes('Redis') ? message : 'No se pudo conectar con la sala',
    503,
    'no-connection',
  );
}

export const MAX_PLAYERS = 8;
