import test from 'node:test';
import assert from 'node:assert/strict';

const { messagesFor, DIFFICULTY_KEYS } = await import('../lib/i18n.ts');

const es = messagesFor('es');
const en = messagesFor('en');

test('los dos diccionarios tienen exactamente las mismas claves', () => {
  assert.deepEqual(Object.keys(es).sort(), Object.keys(en).sort());
});

test('cada clave es del mismo tipo en ambos idiomas', () => {
  for (const key of Object.keys(es)) {
    assert.equal(typeof es[key], typeof en[key], `"${key}" cambia de tipo entre idiomas`);
    if (typeof es[key] === 'function') {
      assert.equal(es[key].length, en[key].length, `"${key}" recibe distintos datos`);
    }
  }
});

test('no hay textos vacios', () => {
  for (const [language, dictionary] of [['es', es], ['en', en]]) {
    for (const [key, value] of Object.entries(dictionary)) {
      if (typeof value === 'string') {
        assert.ok(value.trim().length > 0, `${language}.${key} está vacío`);
      }
    }
  }
});

test('el ingles esta de verdad traducido, no copiado', () => {
  // Un puñado de claves que no pueden coincidir: si coinciden, se olvidaron.
  for (const key of ['playSolo', 'createRoom', 'gameOver', 'hint', 'error.not-your-turn']) {
    assert.notEqual(en[key], es[key], `"${key}" sigue en castellano en el diccionario inglés`);
  }
});

test('las funciones interpolan los datos que reciben', () => {
  assert.match(es.turnOf('Cesar'), /Cesar/);
  assert.match(en.turnOf('Cesar'), /Cesar/);
  assert.match(es.mistakes(1), /1/);
  assert.notEqual(es.wordsPlural(1), es.wordsPlural(2), 'el singular y el plural difieren');
  assert.notEqual(en.wordsPlural(1), en.wordsPlural(2));
});

test('cada dificultad tiene su etiqueta en ambos idiomas', () => {
  for (const [difficulty, keys] of Object.entries(DIFFICULTY_KEYS)) {
    for (const key of keys) {
      assert.ok(es[key], `falta ${key} para ${difficulty} en castellano`);
      assert.ok(en[key], `falta ${key} para ${difficulty} en inglés`);
    }
  }
});

test('idioma desconocido cae en castellano en vez de romper', () => {
  assert.equal(messagesFor('fr'), es);
});
