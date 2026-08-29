import test from 'node:test';
import assert from 'node:assert/strict';

const {
  generateChallengeCode,
  normalizeChallengeCode,
  normalizeAttemptId,
  newAttemptId,
  attemptGame,
  summarize,
  rankResults,
  CHALLENGE_LIVES,
  summarizeChallenge,
  parseCodes,
  MAX_OWN_CHALLENGES,
} = await import('../lib/challenge.ts');
const { applyGuess, LIVES_BY_DIFFICULTY } = await import('../lib/gameLogic.ts');

const challenge = {
  code: 'AB12CD',
  word: 'cocodrilo',
  authorName: 'Papa',
  createdAt: 0,
};

test('los codigos de reto son largos y sin caracteres ambiguos', () => {
  for (let i = 0; i < 200; i += 1) {
    const code = generateChallengeCode();
    assert.match(code, /^[A-HJ-NP-Z2-9]{6}$/);
    assert.equal(normalizeChallengeCode(code.toLowerCase()), code);
  }
  assert.equal(normalizeChallengeCode('AB'), null);
  assert.equal(normalizeChallengeCode('no-vale!'), null);
});

test('los identificadores de intento son unicos y validables', () => {
  const seen = new Set();
  for (let i = 0; i < 500; i += 1) {
    const id = newAttemptId();
    assert.equal(normalizeAttemptId(id), id);
    seen.add(id);
  }
  assert.equal(seen.size, 500);
  assert.equal(normalizeAttemptId('corto'), null);
  assert.equal(normalizeAttemptId('con espacio'), null);
});

test('las vidas de un reto no se separan de las del nivel familiar', () => {
  assert.equal(CHALLENGE_LIVES, LIVES_BY_DIFFICULTY.familiar);
});

test('el intento hereda la palabra del reto y sus vidas', () => {
  const game = attemptGame(challenge, 'Hijo');
  assert.equal(game.word, 'cocodrilo');
  assert.equal(game.status, 'playing');
  assert.equal(game.maxWrong, CHALLENGE_LIVES);
  assert.equal(game.setterId, null, 'quien reta no juega el intento de otro');
  assert.deepEqual(game.players, [{ id: 1, name: 'Hijo' }]);
});

test('el intento no resume nada hasta que termina', () => {
  let game = attemptGame(challenge, 'Hijo');
  assert.equal(summarize(game, 'Hijo'), null);

  game = applyGuess(game, 1, 'c').game;
  assert.equal(summarize(game, 'Hijo'), null, 'a medias todavia no cuenta');

  for (const letter of 'odril') {
    game = applyGuess(game, 1, letter).game;
  }
  assert.equal(game.status, 'won');
  const summary = summarize(game, 'Hijo');
  assert.equal(summary.status, 'won');
  assert.equal(summary.wrongCount, 0);
  assert.equal(summary.tries, 6);
});

test('la tabla ordena por ganar, luego por fallos y por letras', () => {
  const ranked = rankResults([
    { name: 'D', status: 'lost', wrongCount: 6, maxWrong: 6, tries: 12, at: 4 },
    { name: 'B', status: 'won', wrongCount: 1, maxWrong: 6, tries: 8, at: 2 },
    { name: 'A', status: 'won', wrongCount: 1, maxWrong: 6, tries: 6, at: 1 },
    { name: 'C', status: 'won', wrongCount: 3, maxWrong: 6, tries: 7, at: 3 },
  ]);
  assert.deepEqual(ranked.map((r) => r.name), ['A', 'B', 'C', 'D']);
});

test('ordenar no altera la lista original', () => {
  const results = [
    { name: 'Z', status: 'lost', wrongCount: 6, maxWrong: 6, tries: 9, at: 1 },
    { name: 'A', status: 'won', wrongCount: 0, maxWrong: 6, tries: 5, at: 2 },
  ];
  rankResults(results);
  assert.deepEqual(results.map((r) => r.name), ['Z', 'A']);
});

test('el resumen de un reto cuenta intentos y aciertos', () => {
  const results = [
    { name: 'A', status: 'won', wrongCount: 1, maxWrong: 6, tries: 6, at: 1 },
    { name: 'B', status: 'lost', wrongCount: 6, maxWrong: 6, tries: 9, at: 2 },
    { name: 'C', status: 'won', wrongCount: 0, maxWrong: 6, tries: 5, at: 3 },
  ];
  const summary = summarizeChallenge(challenge, results);
  assert.equal(summary.code, 'AB12CD');
  assert.equal(summary.wordLength, 9, 'la longitud, nunca la palabra');
  assert.equal(summary.tried, 3);
  assert.equal(summary.solved, 2);
  assert.equal(JSON.stringify(summary).includes('cocodrilo'), false);
});

test('un reto sin intentos resume en ceros', () => {
  const summary = summarizeChallenge(challenge, []);
  assert.equal(summary.tried, 0);
  assert.equal(summary.solved, 0);
});

test('los codigos de la lista se limpian, deduplican y acotan', () => {
  assert.deepEqual(parseCodes('ab12cd,EF34GH'), ['AB12CD', 'EF34GH']);
  assert.deepEqual(parseCodes('AB12CD,AB12CD'), ['AB12CD'], 'sin repetidos');
  assert.deepEqual(parseCodes('AB12CD,no!,x'), ['AB12CD'], 'descarta los inválidos');
  assert.deepEqual(parseCodes(''), []);
  assert.deepEqual(parseCodes(null), []);

  const muchos = Array.from({ length: 40 }, (_, i) => `AB12C${i.toString(36)}`).join(',');
  assert.equal(parseCodes(muchos).length, MAX_OWN_CHALLENGES, 'acotado para no pedir de más');
});
