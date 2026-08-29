import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync, readdirSync } from 'node:fs';

// La logica es TypeScript sin tipos en tiempo de ejecucion: la cargamos con el
// stripper nativo de Node 22 a traves de un import dinamico.
const {
  applyGuess,
  applyHint,
  createGame,
  addPlayer,
  restartGame,
  toPublicGame,
  normalizeRoomCode,
  generateRoomCode,
  normalizeCustomWord,
  partsToDraw,
  currentPlayer,
  guessers,
  normalizeGame,
  LIVES_BY_DIFFICULTY,
} = await import('../lib/gameLogic.ts');

function playing(word, players = ['A', 'B'], options = {}) {
  let game = createGame({
    roomCode: 'TEST',
    language: 'es',
    difficulty: options.difficulty ?? 'familiar',
    word,
    hostName: players[0],
    wordSource: options.wordSource,
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

test('se pierde al agotar las vidas y la palabra se revela', () => {
  let game = playing('sol');
  assert.equal(game.maxWrong, LIVES_BY_DIFFICULTY.familiar);
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

test('cada idioma pasa de mil palabras', () => {
  for (const language of ['es', 'en']) {
    const total = ['infantil', 'familiar', 'experto'].reduce(
      (count, difficulty) =>
        count + JSON.parse(readFileSync(`data/words/${language}-${difficulty}.json`, 'utf8')).length,
      0,
    );
    assert.ok(total >= 1000, `${language} tiene ${total} palabras, menos de mil`);
  }
});

test('todas las listas de palabras son utilizables', () => {
  const files = readdirSync('data/words').filter((name) => name.endsWith('.json'));
  assert.equal(files.length, 6);

  const limits = { infantil: [3, 7], familiar: [5, 11], experto: [8, 40] };
  for (const file of files) {
    const [, difficulty] = file.replace('.json', '').split('-');
    const words = JSON.parse(readFileSync(`data/words/${file}`, 'utf8'));
    const [min, max] = limits[difficulty];

    assert.ok(words.length >= 250, `${file} tiene solo ${words.length} palabras`);
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


test('cada nivel trae sus propias vidas', () => {
  assert.equal(playing('gato', ['A', 'B'], { difficulty: 'infantil' }).maxWrong, 8);
  assert.equal(playing('gato', ['A', 'B'], { difficulty: 'familiar' }).maxWrong, 6);
  assert.equal(playing('gato', ['A', 'B'], { difficulty: 'experto' }).maxWrong, 5);
});

test('el dibujo reparte sus seis piezas sobre las vidas que haya', () => {
  assert.equal(partsToDraw(0, 8), 0);
  assert.equal(partsToDraw(8, 8), 6, 'la ultima vida completa el muneco');
  assert.equal(partsToDraw(7, 8) < 6, true, 'antes del final nunca esta completo');
  for (let wrong = 0; wrong <= 6; wrong += 1) {
    assert.equal(partsToDraw(wrong, 6), wrong, 'con seis vidas es uno a uno');
  }
});

test('el marcador cuenta victorias, derrotas y racha', () => {
  let game = playing('sol');
  for (const [index, letter] of [...'sol'].entries()) {
    game = applyGuess(game, (index % 2) + 1, letter).game;
  }
  assert.deepEqual(game.scores, { wins: 1, losses: 0, streak: 1 });

  game = restartGame(game, 'luz');
  assert.deepEqual(game.scores, { wins: 1, losses: 0, streak: 1 }, 'reiniciar no borra el marcador');
  for (const [index, letter] of [...'luz'].entries()) {
    game = applyGuess(game, (index % 2) + 1, letter).game;
  }
  assert.deepEqual(game.scores, { wins: 2, losses: 0, streak: 2 });

  game = restartGame(game, 'sol');
  for (const [index, letter] of [...'bcdfgh'].entries()) {
    game = applyGuess(game, (index % 2) + 1, letter).game;
  }
  assert.deepEqual(game.scores, { wins: 2, losses: 1, streak: 0 }, 'perder corta la racha');
});

test('la pista revela una letra, cuesta una vida y pasa el turno', () => {
  const game = playing('gato');
  const result = applyHint(game, 1, (options) => options[0]);
  assert.equal(result.ok, true);
  assert.equal(result.game.guessed.includes(result.letter), true);
  assert.equal(result.game.wrongCount, 1);
  assert.equal(result.game.turnIndex, 1);
  assert.equal(result.game.hintsUsed, 1);
});

test('solo hay una pista por ronda, y vuelve al reiniciar', () => {
  const first = applyHint(playing('gato'), 1, (o) => o[0]);
  assert.deepEqual(applyHint(first.game, 2, (o) => o[0]), { ok: false, error: 'no-hints-left' });
  assert.equal(restartGame(first.game, 'luna').hintsUsed, 0);
});

test('la pista no esta disponible con una sola vida', () => {
  let game = playing('gato');
  for (const [index, letter] of [...'bcdfh'].entries()) {
    game = applyGuess(game, (index % 2) + 1, letter).game;
  }
  assert.equal(game.wrongCount, 5, 'queda una vida');
  const turn = currentPlayer(game).id;
  assert.deepEqual(applyHint(game, turn, (o) => o[0]), { ok: false, error: 'last-life' });
});

test('la pista respeta el turno', () => {
  assert.deepEqual(applyHint(playing('gato'), 2, (o) => o[0]), {
    ok: false,
    error: 'not-your-turn',
  });
});

test('quien pone la palabra no juega turnos', () => {
  let game = createGame({
    roomCode: 'TEST',
    language: 'es',
    difficulty: 'familiar',
    word: 'cocodrilo',
    hostName: 'Padre',
    wordSource: 'player',
  });
  assert.equal(game.setterId, 1);
  assert.equal(game.status, 'waiting');

  game = addPlayer(game, 'Hijo').game;
  assert.equal(game.status, 'playing', 'con un solo adivinador ya se puede jugar');
  assert.deepEqual(guessers(game).map((p) => p.name), ['Hijo']);
  assert.equal(currentPlayer(game).name, 'Hijo');

  assert.deepEqual(applyGuess(game, 1, 'c'), { ok: false, error: 'not-your-turn' });

  const played = applyGuess(game, 2, 'c');
  assert.equal(played.ok, true);
  assert.equal(currentPlayer(played.game).name, 'Hijo', 'con un adivinador el turno no cambia');

  game = addPlayer(played.game, 'Hija').game;
  const next = applyGuess(game, 2, 'o');
  assert.equal(currentPlayer(next.game).name, 'Hija', 'ahora si alterna entre los dos');
});

test('la palabra escrita por un jugador se limpia como las del banco', () => {
  assert.equal(normalizeCustomWord('  Cocodrilo '), 'cocodrilo');
  assert.equal(normalizeCustomWord('MONTAÑA'), 'montana');
  assert.equal(normalizeCustomWord('café'), 'cafe');
  assert.equal(normalizeCustomWord('ab'), null, 'demasiado corta');
  assert.equal(normalizeCustomWord('a'.repeat(21)), null, 'demasiado larga');
  assert.equal(normalizeCustomWord('dos palabras'), null);
  assert.equal(normalizeCustomWord('perro3'), null);
});

test('una partida guardada por una version anterior se completa al leerla', () => {
  // Exactamente la forma que tenia una sala antes del marcador y las pistas:
  // leerla sin completar rompia el cliente al pintar `scores.wins`.
  const vieja = {
    roomCode: 'OLD1',
    language: 'es',
    difficulty: 'familiar',
    status: 'playing',
    word: 'gato',
    guessed: ['a'],
    wrongCount: 0,
    turnIndex: 1,
    players: [{ id: 1, name: 'A' }, { id: 2, name: 'B' }],
    nextId: 3,
  };

  const game = normalizeGame(vieja);
  assert.deepEqual(game.scores, { wins: 0, losses: 0, streak: 0 });
  assert.equal(game.maxWrong, LIVES_BY_DIFFICULTY.familiar);
  assert.equal(game.wordSource, 'list');
  assert.equal(game.setterId, null);
  assert.equal(game.hintsUsed, 0);
  // Y lo que ya traia no se toca.
  assert.equal(game.word, 'gato');
  assert.equal(game.turnIndex, 1);
  assert.deepEqual(game.guessed, ['a']);
  assert.equal(game.players.length, 2);
});

test('completar una partida no altera la que ya esta al dia', () => {
  const actual = playing('gato');
  assert.deepEqual(normalizeGame(actual), actual);
});

test('una partida completada se puede seguir jugando sin romperse', () => {
  const vieja = normalizeGame({
    roomCode: 'OLD2',
    language: 'es',
    difficulty: 'infantil',
    status: 'playing',
    word: 'sol',
    guessed: [],
    wrongCount: 0,
    turnIndex: 0,
    players: [{ id: 1, name: 'A' }, { id: 2, name: 'B' }],
    nextId: 3,
  });

  assert.equal(vieja.maxWrong, LIVES_BY_DIFFICULTY.infantil, 'recupera las vidas de su nivel');
  const result = applyGuess(vieja, 1, 's');
  assert.equal(result.ok, true);
  assert.equal(result.game.scores.wins, 0);
  assert.equal(toPublicGame(result.game).masked[0], 's');
});
