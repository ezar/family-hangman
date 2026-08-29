import test from 'node:test';
import assert from 'node:assert/strict';

const { resolveRedisCredentials, missingCredentialsMessage } = await import('../lib/redisEnv.ts');

test('prefiere las variables de Upstash cuando estan las dos', () => {
  const found = resolveRedisCredentials({
    UPSTASH_REDIS_REST_URL: 'https://upstash.example',
    UPSTASH_REDIS_REST_TOKEN: 'token-upstash',
    KV_REST_API_URL: 'https://kv.example',
    KV_REST_API_TOKEN: 'token-kv',
  });
  assert.deepEqual(found, {
    url: 'https://upstash.example',
    token: 'token-upstash',
    source: 'UPSTASH_REDIS_REST_URL',
  });
});

test('cae en las variables KV cuando la integracion usa esos nombres', () => {
  const found = resolveRedisCredentials({
    KV_REST_API_URL: 'https://kv.example',
    KV_REST_API_TOKEN: 'token-kv',
  });
  assert.equal(found?.url, 'https://kv.example');
  assert.equal(found?.source, 'KV_REST_API_URL');
});

test('un par incompleto no vale, aunque haya otro completo detras', () => {
  const found = resolveRedisCredentials({
    UPSTASH_REDIS_REST_URL: 'https://upstash.example',
    KV_REST_API_URL: 'https://kv.example',
    KV_REST_API_TOKEN: 'token-kv',
  });
  assert.equal(found?.source, 'KV_REST_API_URL');
});

test('ignora valores vacios o en blanco', () => {
  assert.equal(resolveRedisCredentials({ KV_REST_API_URL: '  ', KV_REST_API_TOKEN: 'x' }), null);
  assert.equal(resolveRedisCredentials({}), null);
});

test('nunca usa el token de solo lectura: el juego escribe en cada letra', () => {
  const found = resolveRedisCredentials({
    KV_REST_API_URL: 'https://kv.example',
    KV_REST_API_READ_ONLY_TOKEN: 'token-solo-lectura',
  });
  assert.equal(found, null);
});

test('el mensaje de error nombra los dos juegos de variables', () => {
  const message = missingCredentialsMessage();
  assert.match(message, /UPSTASH_REDIS_REST_URL/);
  assert.match(message, /KV_REST_API_URL/);
});
