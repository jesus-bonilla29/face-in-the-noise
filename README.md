# The Face in the Noise

Una nube 3D de partículas que reacciona al cursor y al sonido y, de vez en cuando, revela un rostro oculto.

Hecho con React, TypeScript, Vite, Three.js y React Three Fiber.

## Cómo ejecutarlo

```
npm install
npm run dev
```

Abre la dirección que aparezca en la terminal (normalmente http://localhost:5173).

## Comandos

| Comando           | Qué hace                                  |
| ----------------- | ----------------------------------------- |
| `npm run dev`     | Servidor de desarrollo                    |
| `npm run build`   | Comprueba los tipos y genera `dist/`      |
| `npm run preview` | Sirve la versión generada por `build`     |
| `npm run lint`    | Revisa el código con Oxlint               |

## Cómo interactuar

- Mueve el cursor (o toca): las partículas se apartan como polvo.
- Mantén pulsado: las partículas se acercan.
- Classic, Flow y Swirl cambian el movimiento de la nube.
- "Reveal face" fuerza la aparición del rostro. Si no lo pulsas, aparece solo cada cierto tiempo.
- "Sound" activa la música. Los graves agrandan y encienden las partículas, y aceleran el movimiento.
- "I see a face" aparece solo mientras el rostro es visible y suma uno al contador (uno por aparición).
- "Share" comparte el resultado con el menú del sistema o, si no existe, lo copia al portapapeles.

El contador se guarda en el navegador (localStorage).

## Rostros a partir de fotos

El rostro que aparece sale de una foto convertida en partículas: las partículas se reparten donde la foto es más oscura que su entorno (ojos, cejas, boca, pelo, sombras), como un dibujo a carboncillo hecho de puntos luminosos. En cada aparición toca la foto siguiente de la lista, y si un rostro todavía está deshaciéndose, se transforma en el siguiente sin saltos.

1. Copia las fotos a `public/faces/` (consejos en `public/faces/README.md`).
2. Comprueba que `src/features/face/faces.ts` tiene una línea por cada foto, con el mismo nombre de archivo.
3. Recarga. La consola del navegador indica cuántas fotos se cargaron y cuáles faltan.

Si no hay ninguna foto, se usa un rostro dibujado. Si una foto falta o está dañada, se omite sin romper nada. La aplicación no reconoce ni identifica a nadie ni muestra nombres: solo convierte en partículas la imagen que le des.

## Estructura

```
public/
├── audio/      ambient.mp3, la pista de fondo
└── faces/      las fotos de los rostros (las pones tú)
src/
├── app/          App.tsx, la composición principal
├── features/
│   ├── particles/  motor de partículas, estrategias de movimiento y escena 3D
│   ├── face/       lista de fotos (faces.ts), conversión a partículas y ciclo de aparición
│   ├── audio/      AudioAnalyzer: adapta la Web Audio API a un número de 0 a 1
│   └── controls/   botones, contador, "I see a face" y compartir
├── shared/       constantes compartidas (presets.ts)
└── styles/       global.css
```

## Ajustes rápidos

| Qué cambiar                         | Dónde                                           |
| ----------------------------------- | ----------------------------------------------- |
| Qué fotos se muestran               | `src/features/face/faces.ts`                    |
| Si la cara no está centrada en la foto | `options` en `faces.ts` (`focusX`, `focusY`, `zoom`) |
| Más o menos detalle en los rostros  | `src/features/face/faceTargets.ts` (`INK_GAIN`, `EDGE_WEIGHT`, `TONE_FLOOR`) |
| Número de partículas                | `src/shared/presets.ts` (`PARTICLE_COUNT`)      |
| Cuándo y cuánto aparece el rostro   | `src/features/face/faceReveal.ts`               |
| Fuerza y alcance del cursor         | `src/features/particles/particleEngine.ts`      |
| Música                              | Sustituye `public/audio/ambient.mp3`            |
| Sensibilidad al sonido              | `src/features/audio/AudioAnalyzer.ts` (`LEVEL_GAIN`) |
| Encuadre en pantallas estrechas     | `src/shared/presets.ts` (`VIEW_WIDTH`)          |

## Estado

- Día 1: escena y nube de partículas.
- Día 2: cursor, modos Classic / Flow / Swirl, rostro oculto y controles.
- Día 3: sonido, contador de rostros, compartir y diseño para móvil.
- Después: rostros a partir de fotos, con rotación y transformación entre ellos.

Probado en Chromium (escritorio, móvil vertical y horizontal; los rostros, con retratos de prueba). Pendiente: Safari/iOS, pruebas automáticas con Vitest y publicación.
