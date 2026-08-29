import test from 'node:test';
import assert from 'node:assert/strict';

const { patternOf, candidatesFor, chooseGroup, playableLengths, evilStart, applyEvilGuess } =
  await import('../lib/evil.ts');
const { createGame, addPlayer, maskedWord } = await import('../lib/gameLogic.ts');

const first = (options) => options[0];

/** Partida tramposa de un solo jugador, como el modo solo. */
function evilGame(word) {
  const game = createGame({
    roomCode: 'EVIL',
    language: 'es',
    difficulty: 'familiar',
    word,
    hostName: 'Yo',
    wordSource: 'evil',
  });
  return { ...game, status: 'playing' };
}

/** Partida tramposa de dos, para comprobar los turnos. */
function evilDuo(word) {
  return addPlayer(evilGame(word), 'Otro').game;
}

test('la huella de una letra marca sus posiciones', () => {
  assert.equal(patternOf('gato', 'a'), '.a..');
  assert.equal(patternOf('casa', 'a'), '.a.a');
  assert.equal(patternOf('gato', 'z'), '....');
});

test('las candidatas respetan todo lo preguntado, presente y ausente', () => {
  const words = ['gato', 'pato', 'gara', 'malo', 'cosa'];
  // Con 'a' en la posicion 1 y sin 'o' final descartadas por la huella de 'g'.
  assert.deepEqual(candidatesFor(words, 'gato', ['a']), ['gato', 'pato', 'malo']);
  assert.deepEqual(candidatesFor(words, 'gato', ['a', 'g']), ['gato']);
  assert.deepEqual(
    candidatesFor(words, 'gato', ['z']),
    ['gato', 'pato', 'gara', 'malo', 'cosa'],
    'una letra ausente en todas no descarta ninguna',
  );
});

test('elige el grupo mas numeroso', () => {
  // Tres sin 'a' contra dos con 'a': gana el grupo grande, que ademas no la tiene.
  const group = chooseGroup(['gato', 'pato', 'seto', 'sito', 'moto'], 'a');
  assert.equal(group.pattern, '....');
  assert.equal(group.words.length, 3);
});

test('a igualdad de tamano, prefiere no revelar la letra', () => {
  // Un grupo con 'a' y otro sin ella, ambos de una palabra: gana esconderla.
  const group = chooseGroup(['gato', 'seto'], 'a');
  assert.equal(group.pattern, '....');
  assert.deepEqual(group.words, ['seto']);
});

test('a igualdad, prefiere revelar la letra menos veces', () => {
  // Dos grupos de una palabra, los dos con 'a': gana el que la enseña menos.
  const group = chooseGroup(['casa', 'mano'], 'a');
  assert.equal(group.pattern, '.a..', 'una sola "a" antes que dos');
  assert.deepEqual(group.words, ['mano']);
});

test('el tramposo esquiva de verdad: una letra que estaba deja de estar', () => {
  // 'gato' tiene 'a', pero hay mas palabras sin ella, asi que el juego se muda.
  const words = ['gato', 'pato', 'seto', 'sito', 'moto'];
  const result = applyEvilGuess(evilGame('gato'), 1, 'a', words, first);

  assert.equal(result.ok, true);
  assert.equal(result.correct, false, 'responde que no hay "a"');
  assert.equal(result.game.word.includes('a'), false, 'y se muda a una palabra sin "a"');
  assert.equal(result.game.wrongCount, 1);
  assert.equal(result.game.candidatesLeft, 3);
});

test('no puede mentir: la palabra final encaja con todas las respuestas', () => {
  const words = ['gato', 'pato', 'seto', 'sito', 'moto', 'mano', 'casa'];
  let game = evilGame('gato');
  const answers = [];

  for (const letter of ['a', 'o', 't', 's']) {
    const result = applyEvilGuess(game, 1, letter, words, first);
    if (!result.ok) continue;
    answers.push([letter, result.correct]);
    game = result.game;
  }

  assert.equal(words.includes(game.word), true, 'la palabra final es del banco');
  for (const [letter, correct] of answers) {
    assert.equal(
      game.word.includes(letter),
      correct,
      `dijo ${correct ? 'que si' : 'que no'} de "${letter}" y la palabra final lo confirma`,
    );
  }
});

test('la mascara mostrada nunca contradice lo respondido', () => {
  const words = ['gato', 'pato', 'seto', 'sito', 'moto'];
  let game = evilGame('gato');
  const result = applyEvilGuess(game, 1, 'o', words, first);
  game = result.game;

  const masked = maskedWord(game.word, game.guessed);
  assert.equal(masked.filter((l) => l === 'o').length, result.correct ? 1 : 0);
  assert.equal(masked.length, 4, 'la longitud no cambia nunca a mitad de partida');
});

test('la longitud se mantiene durante toda la partida', () => {
  const words = ['gato', 'pato', 'seto', 'casas', 'moto'];
  let game = evilGame('gato');
  for (const letter of ['a', 'e', 'i']) {
    const result = applyEvilGuess(game, 1, letter, words, first);
    game = result.game;
    assert.equal(game.word.length, 4);
  }
});

test('se puede ganar cuando ya no queda donde esconderse', () => {
  const words = ['sol'];
  let game = evilGame('sol');
  for (const letter of ['s', 'o', 'l']) {
    const result = applyEvilGuess(game, 1, letter, words, first);
    game = result.game;
  }
  assert.equal(game.status, 'won');
  assert.equal(game.word, 'sol');
});

test('rechaza lo mismo que una jugada normal', () => {
  const words = ['gato', 'pato'];
  const duo = evilDuo('gato');

  assert.deepEqual(applyEvilGuess(duo, 2, 'a', words, first), {
    ok: false,
    error: 'not-your-turn',
  });
  assert.deepEqual(applyEvilGuess(duo, 9, 'a', words, first), {
    ok: false,
    error: 'unknown-player',
  });
  assert.deepEqual(applyEvilGuess(duo, 1, '4', words, first), {
    ok: false,
    error: 'invalid-letter',
  });

  const played = applyEvilGuess(duo, 1, 'a', words, first);
  assert.equal(played.game.turnIndex, 1, 'el turno pasa igual que siempre');
  assert.deepEqual(applyEvilGuess(played.game, 2, 'a', words, first), {
    ok: false,
    error: 'already-guessed',
  });
});

test('solo se juegan longitudes con margen para esconderse', () => {
  const words = [...Array(30).keys()].map((i) => `aaa${i}`.slice(0, 4)).concat(['xy', 'zw']);
  assert.deepEqual(playableLengths(words, 20), [4]);
  assert.equal(playableLengths(['ab', 'cd'], 20).length, 0);
});

test('el arranque elige una longitud con margen de sobra', () => {
  const words = ['gato', 'pato', 'seto', 'moto', 'sito', 'sol'];
  assert.equal(evilStart(words, first, 20), null, 'sin longitudes numerosas no arranca');

  const started = evilStart(words, first, 5);
  assert.equal(started.word.length, 4, 'coge el largo que si tiene suficientes');
  assert.equal(started.candidatesLeft, 5);
});
