import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync, readdirSync } from 'node:fs';

// La logica es TypeScript sin tipos en tiempo de ejecucion: la cargamos con el
// stripper nativo de Node 22 a traves de un import dinamico.
const { applyGuess, createGame, addPlayer, restartGame, toPublicGame, normalizeRoomCode, generateRoomCode } =
  await import('../lib/gameLogic.ts');

function playing(word, players = ['A', 'B']) {
  let game = createGame({
    roomCode: 'TEST',
    language: 'es',
    difficulty: 'familiar',
    word,
    hostName: players[0],
  });
  for (const name of players.slice(1)) {
    game = addPlayer(game, name).game;
  }
  return game;
}

test('la partida arranca al entrar el segundo jugador', () => {
  const solo = createGame({
    roomCode: 'TEST',
    language: 'es',
    difficulty: 'familiar',
    word: 'gato',
    hostName: 'A',
  });
  assert.equal(solo.status, 'waiting');
  assert.equal(addPlayer(solo, 'B').game.status, 'playing');
});

test('el turno pasa al siguiente jugador tanto si acierta como si falla', () => {
  const game = playing('gato');
  const hit = applyGuess(game, 1, 'g');
  assert.equal(hit.ok, true);
  assert.equal(hit.correct, true);
  assert.equal(hit.game.turnIndex, 1);

  const miss = applyGuess(hit.game, 2, 'z');
  assert.equal(miss.correct, false);
  assert.equal(miss.game.wrongCount, 1);
  assert.equal(miss.game.turnIndex, 0);
});

test('no se puede jugar fuera de turno', () => {
  const game = playing('gato');
  const result = applyGuess(game, 2, 'a');
  assert.deepEqual(result, { ok: false, error: 'not-your-turn' });
});

test('no se puede repetir una letra ya probada', () => {
  const game = playing('gato');
  const first = applyGuess(game, 1, 'g');
  const repeat = applyGuess(first.game, 2, 'g');
  assert.deepEqual(repeat, { ok: false, error: 'already-guessed' });
});

test('rechaza letras no validas y jugadores desconocidos', () => {
  const game = playing('gato');
  assert.deepEqual(applyGuess(game, 1, '4'), { ok: false, error: 'invalid-letter' });
  assert.deepEqual(applyGuess(game, 1, 'ab'), { ok: false, error: 'invalid-letter' });
  assert.deepEqual(applyGuess(game, 99, 'a'), { ok: false, error: 'unknown-player' });
});

test('se gana al completar la palabra', () => {
  let game = playing('sol');
  for (const [index, letter] of [...'sol'].entries()) {
    const result = applyGuess(game, (index % 2) + 1, letter);
    assert.equal(result.ok, true);
    game = result.game;
  }
  assert.equal(game.status, 'won');
  assert.equal(applyGuess(game, 1, 'z').error, 'not-playing');
});

test('se pierde tras seis fallos y la palabra se revela', () => {
  let game = playing('sol');
  for (const [index, letter] of [...'bcdfgh'].entries()) {
    game = applyGuess(game, (index % 2) + 1, letter).game;
  }
  assert.equal(game.wrongCount, 6);
  assert.equal(game.status, 'lost');
  assert.equal(toPublicGame(game).word, 'sol');
});

test('la palabra no viaja al cliente mientras se juega', () => {
  const game = playing('gato');
  const view = toPublicGame(applyGuess(game, 1, 'g').game);
  assert.equal(view.word, null);
  assert.equal(view.wordLength, 4);
  assert.deepEqual(view.masked, ['g', null, null, null]);
});

test('reiniciar limpia el tablero y mantiene a los jugadores', () => {
  let game = playing('sol');
  game = applyGuess(game, 1, 's').game;
  const next = restartGame(game, 'luna');
  assert.deepEqual(next.guessed, []);
  assert.equal(next.wrongCount, 0);
  assert.equal(next.turnIndex, 0);
  assert.equal(next.status, 'playing');
  assert.equal(next.players.length, 2);
});

test('los codigos de sala son legibles y sin caracteres ambiguos', () => {
  for (let i = 0; i < 200; i += 1) {
    const code = generateRoomCode();
    assert.match(code, /^[A-HJ-NP-Z2-9]{4}$/);
    assert.equal(normalizeRoomCode(code.toLowerCase()), code);
  }
  assert.equal(normalizeRoomCode('AB'), null);
});

test('todas las listas de palabras son utilizables', () => {
  const files = readdirSync('data/words').filter((name) => name.endsWith('.json'));
  assert.equal(files.length, 6);

  const limits = { infantil: [3, 7], familiar: [5, 11], experto: [8, 40] };
  for (const file of files) {
    const [, difficulty] = file.replace('.json', '').split('-');
    const words = JSON.parse(readFileSync(`data/words/${file}`, 'utf8'));
    const [min, max] = limits[difficulty];

    assert.ok(words.length >= 150, `${file} tiene solo ${words.length} palabras`);
    assert.equal(new Set(words).size, words.length, `${file} tiene duplicados`);
    for (const word of words) {
      assert.match(word, /^[a-z]+$/, `${file}: "${word}" tiene caracteres no validos`);
      assert.ok(
        word.length >= min && word.length <= max,
        `${file}: "${word}" mide ${word.length}, fuera de ${min}-${max}`,
      );
    }
  }
});
