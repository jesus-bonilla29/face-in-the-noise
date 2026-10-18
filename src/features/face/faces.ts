import type { PhotoOptions } from "./faceTargets";

// Lista de rostros que se van turnando en cada aparición.
//
// Para añadir uno: copia la foto a public/faces/ y añade una línea aquí.
// Si un archivo no existe se omite sin romper nada, y si no hay ninguna foto
// disponible la aplicación usa el rostro dibujado.
//
// Consejos para las fotos (ver public/faces/README.md):
//   - De frente, con la cara centrada y ocupando entre el 50 % y el 70 % del alto.
//   - Formato vertical 4:5 (por ejemplo 800 × 1000 px). Si no lo es, se recorta el centro.
//   - Mejor con buena luz y fondo liso. Si la cara no está centrada, usa `options`.

export type FaceEntry = {
  id: string;
  name: string; // por si más adelante quieres mostrar o adivinar quién es
  src: string;
  options?: PhotoOptions;
};

const base = import.meta.env.BASE_URL;

export const FACES: FaceEntry[] = [
  { id: "brad-pitt", name: "Brad Pitt", src: `${base}faces/brad-pitt.jpg` },
  { id: "leonardo-dicaprio", name: "Leonardo DiCaprio", src: `${base}faces/leonardo-dicaprio.jpg` },
  { id: "angelina-jolie", name: "Angelina Jolie", src: `${base}faces/angelina-jolie.jpg` },
  { id: "emma-watson", name: "Emma Watson", src: `${base}faces/emma-watson.jpg` },
  { id: "emma-stone", name: "Emma Stone", src: `${base}faces/emma-stone.jpg` },

  // Ejemplo con ajustes, para una foto donde la cara queda a la izquierda y pequeña:
  // { id: "ejemplo", name: "Ejemplo", src: `${base}faces/ejemplo.jpg`, options: { focusX: 0.35, focusY: 0.4, zoom: 1.6 } },
];
