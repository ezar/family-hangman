/**
 * Node resuelve modulos ES por ruta exacta, asi que un `import './types'` sin
 * extension no lo encuentra aunque TypeScript si. Este enganche le anade la
 * extension para que los tests puedan cargar el codigo tal cual esta escrito,
 * en vez de obligar a la aplicacion a escribir imports para el banco de pruebas.
 */
export function resolve(specifier, context, next) {
  if (specifier.startsWith('.') && !/\.[a-z]+$/i.test(specifier)) {
    return next(`${specifier}.ts`, context);
  }
  return next(specifier, context);
}
