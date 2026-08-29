import test from 'node:test';
import assert from 'node:assert/strict';

const { addEntry, entryId, historyStats, MAX_HISTORY } = await import('../lib/history.ts');

const entry = (id, status = 'won', word = 'gato') => ({
  id,
  kind: 'solo',
  at: 0,
  status,
  word,
  wrongCount: 1,
  maxWrong: 6,
  language: 'es',
});

test('la identidad de una ronda distingue tipo, sitio y numero', () => {
  assert.equal(entryId('room', 'AB12', 0), 'room:AB12:0');
  assert.notEqual(entryId('room', 'AB12', 0), entryId('room', 'AB12', 1));
  assert.notEqual(entryId('room', 'AB12', 0), entryId('solo', 'AB12', 0));
});

test('la partida mas reciente queda arriba', () => {
  const history = addEntry(addEntry([], entry('a')), entry('b'));
  assert.deepEqual(history.map((e) => e.id), ['b', 'a']);
});

test('apuntar dos veces la misma ronda no la duplica', () => {
  const once = addEntry([], entry('a'));
  const twice = addEntry(once, entry('a'));
  assert.equal(twice.length, 1);
  assert.equal(twice, once, 'ni siquiera crea una lista nueva');
});

test('el historial no crece sin limite', () => {
  let history = [];
  for (let i = 0; i < MAX_HISTORY + 25; i += 1) {
    history = addEntry(history, entry(`e${i}`));
  }
  assert.equal(history.length, MAX_HISTORY);
  assert.equal(history[0].id, `e${MAX_HISTORY + 24}`, 'se van las viejas, no las nuevas');
});

test('las cuentas resumen jugadas, ganadas y mejor racha', () => {
  // Guardadas de la mas reciente a la mas antigua: en orden de juego seria
  // ganada, ganada, ganada, perdida, ganada.
  const history = [
    entry('5', 'won'),
    entry('4', 'lost'),
    entry('3', 'won'),
    entry('2', 'won'),
    entry('1', 'won'),
  ];
  assert.deepEqual(historyStats(history), { played: 5, won: 4, bestStreak: 3 });
});

test('sin partidas, las cuentas son cero', () => {
  assert.deepEqual(historyStats([]), { played: 0, won: 0, bestStreak: 0 });
});

test('calcular las cuentas no altera el historial', () => {
  const history = [entry('2', 'won'), entry('1', 'lost')];
  historyStats(history);
  assert.deepEqual(history.map((e) => e.id), ['2', '1']);
});
