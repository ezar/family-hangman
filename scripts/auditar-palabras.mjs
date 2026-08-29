/**
 * Contrasta las listas de palabras contra un diccionario real de cada idioma.
 *
 * Los tests comprueban formato, longitud y duplicados, pero no que la palabra
 * exista: "cigueena" pasaba los tres y no es nada. Esto lo caza.
 *
 * Los diccionarios pesan 11 MB y solo hacen falta al ampliar las listas, asi
 * que no son dependencia del proyecto. Antes de ejecutarlo:
 *
 *   npm i --no-save an-array-of-spanish-words an-array-of-english-words
 *   node scripts/auditar-palabras.mjs
 *
 * Sale con codigo 1 si encuentra algo, para poder encadenarlo si hiciera falta.
 */
import { readFileSync } from 'node:fs';
import { createRequire } from 'node:module';

// Los diccionarios se publican como JSON, que require carga sin ceremonias.
const require = createRequire(import.meta.url);

/** La misma limpieza que aplica el juego: sin tildes y con la eñe como n. */
const normalize = (word) =>
  word
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .replace(/ñ/g, 'n')
    .toLowerCase();

/**
 * Palabras correctas que al diccionario le faltan. Cada una comprobada a mano
 * contra el diccionario de la RAE; sin esto la auditoria cria ruido y se deja
 * de mirar.
 */
const ACEPTADAS = new Set([
  // Correctas pero ausentes del diccionario que usamos. Cada una comprobada a
  // mano: sin este filtro la auditoria cria ruido y se deja de mirar.
  'ciguena', // cigüeña
  'brocoli', // brócoli
  'koala',
  'apocalipsis',
  'kiwi',
  'pajita',
  'arcoiris',
  'kilometro',
  // Los dias en ingles van en mayuscula, asi que el diccionario no los trae;
  // en el juego todo es minuscula y en castellano si estan.
  'monday',
  'friday',
  'sunday',
]);

function load(packageName) {
  try {
    return new Set(require(packageName).map(normalize));
  } catch (error) {
    // Solo el "no está instalado" merece la instrucción de instalarlo; con
    // cualquier otro fallo hay que ver el error de verdad.
    if (error.code !== 'MODULE_NOT_FOUND') throw error;
    console.error(
      `Falta ${packageName}. Instala los diccionarios sin guardarlos en package.json:\n` +
        '  npm i --no-save an-array-of-spanish-words an-array-of-english-words',
    );
    process.exit(2);
  }
}

const dictionaries = {
  es: load('an-array-of-spanish-words'),
  en: load('an-array-of-english-words'),
};

let problems = 0;

for (const language of ['es', 'en']) {
  for (const level of ['infantil', 'familiar', 'experto']) {
    const file = `data/words/${language}-${level}.json`;
    const words = JSON.parse(readFileSync(file, 'utf8'));
    const unknown = words.filter(
      (word) => !dictionaries[language].has(word) && !ACEPTADAS.has(word),
    );

    problems += unknown.length;
    const status = unknown.length === 0 ? 'ok' : `${unknown.length} sin encontrar`;
    console.log(`${file.padEnd(32)} ${String(words.length).padStart(4)} palabras  ${status}`);
    if (unknown.length > 0) console.log(`   ${unknown.join(' ')}`);
  }
}

if (problems > 0) {
  console.log(
    `\n${problems} por revisar. Si alguna es correcta y al diccionario le falta,` +
      ' añádela a ACEPTADAS con un comentario.',
  );
  process.exit(1);
}

console.log('\nTodas las palabras existen en su idioma.');
