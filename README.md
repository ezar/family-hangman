# Ahorcado en Familia

Ahorcado por turnos para jugar en familia desde cualquier sitio, no solo desde
la misma red. Dos modos, palabras en español e inglés y tres niveles de
dificultad.

- **Jugar solo** — un jugador contra la palabra. Sin sala, sin red y sin
  backend: la partida entera vive en el navegador.
- **Partida grupal** — se crea una sala con código de 4 caracteres, se comparte
  el enlace y se juega por turnos desde cualquier móvil. La palabra puede salir
  del banco o **ponerla un jugador**, que entonces mira sin jugar.

## Cómo funciona

Next.js 14 (App Router) desplegado en Vercel. Como Vercel no mantiene procesos
vivos entre peticiones, no hay WebSocket propio: el estado compartido de cada
partida vive en **Upstash Redis** como un único blob JSON por sala
(`game:{roomCode}`), y cada cliente pregunta el estado una vez por segundo.
Para un juego por turnos el polling no se nota.

La lógica del juego (`lib/gameLogic.ts`) es pura y no sabe nada de red: la usan
por igual la API route del modo grupal y el modo solo en el navegador.

### Reglas

- El turno pasa al siguiente jugador tras cada intento, acierte o falle.
- Las vidas dependen del nivel: 8 en infantil, 6 en familiar y 5 en experto.
  El dibujo siempre tiene seis piezas y las reparte sobre las vidas que haya.
- Una **pista** por ronda: revela una letra a cambio de una vida y pasa el
  turno. No está disponible con una sola vida, para que la ayuda no sea justo
  lo que acabe con la partida.
- Quien pone la palabra no juega turnos ni gasta pistas.
- El **marcador** de la sala (ganadas, perdidas y racha) sobrevive entre rondas.
- No se puede jugar fuera de turno ni repetir una letra ya probada.
- La palabra nunca viaja al cliente mientras se juega: la API envía solo la
  máscara (letras acertadas y huecos) y la revela al terminar.

### Aviso de concurrencia

La mutación lee el JSON de Redis, lo modifica y lo vuelve a escribir entero. Si
dos jugadores enviasen una letra en el mismo instante exacto hay una ventana de
carrera teórica. Para un juego familiar por turnos es un riesgo asumido; si
llegase a molestar se resuelve con un script Lua atómico de Upstash o con un
compare-and-swap.

## Puesta en marcha

```bash
npm install
cp .env.example .env.local   # rellena las dos variables de Upstash
npm run dev
```

El modo solo funciona sin configurar nada. El modo grupal necesita Upstash
Redis: en Vercel se añade desde el marketplace (plan gratuito) y las variables
se inyectan solas.

Según cómo se instale la integración, las credenciales aparecen con uno u otro
nombre, así que el código acepta los dos pares y usa el primero que esté
completo:

| Par | Origen |
|-----|--------|
| `UPSTASH_REDIS_REST_URL` + `UPSTASH_REDIS_REST_TOKEN` | integración de Upstash |
| `KV_REST_API_URL` + `KV_REST_API_TOKEN` | nombres heredados de Vercel KV |

`KV_REST_API_READ_ONLY_TOKEN` no sirve: el juego escribe en Redis con cada
letra. Al conectar la base de datos conviene marcar los tres entornos
(Production, Preview y Development), o `vercel env pull` no traerá nada para
desarrollar en local.

Las salas caducan a las 12 horas para no acumular basura en Redis.

## Comandos

| Comando            | Qué hace                                     |
|--------------------|----------------------------------------------|
| `npm run dev`      | Servidor de desarrollo                       |
| `npm run build`    | Build de producción                          |
| `npm run lint`     | ESLint                                       |
| `npm run typecheck`| TypeScript sin emitir                        |
| `npm test`         | Tests de la lógica pura y de las listas       |

## Estructura

```
app/
  page.tsx              elegir modo, crear sala o unirse
  solo/page.tsx         ahorcado de un jugador, sin red
  room/[code]/          tablero de la partida grupal
  api/                  create · join · state · guess · hint · restart
components/             tablero, teclado, dibujo, overlays
lib/
  gameLogic.ts          lógica pura: turnos, victoria y derrota
  redis.ts              cliente de Upstash
  gameStore.ts          estado local del cliente (Zustand)
  useRoom.ts            polling del estado de la sala
  useFeedback.ts        sonido sintetizado y vibración, sin ficheros de audio
data/words/             seis listas: {es,en} x {infantil,familiar,experto}
```

## Palabras

Un archivo por idioma y dificultad, con un array plano de palabras en
minúsculas y sin acentos ni eñes (para que el teclado sea de 26 letras).

| Nivel     | Longitud | Perfil                     |
|-----------|----------|----------------------------|
| Infantil  | 3-7      | niños que empiezan a leer  |
| Familiar  | 5-11     | uso general                |
| Experto   | 8+       | adultos, reto real         |

Entre 220 y 320 palabras por lista. Los tests comprueban que no haya
duplicados, caracteres inválidos ni palabras fuera de la banda de su nivel, así
que ampliar una lista es seguro: si algo no encaja, salta el test.

## Fuera de alcance (a propósito)

Categorías temáticas, reconexión a mitad de partida, puntuación entre salas
distintas y chat entre jugadores.
