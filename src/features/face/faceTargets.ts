// Posiciones objetivo del rostro oculto.
//
// Un rostro, venga de donde venga, se convierte primero en un "mapa de pesos":
// una cuadrícula donde cada celda dice cuánta probabilidad tiene de recibir una
// partícula. Después se reparten las partículas según esos pesos (una celda con
// el doble de peso recibe, de media, el doble de partículas). Además cada celda
// tiene una profundidad (z), para que el rostro tenga relieve.
//
// Hay dos orígenes:
//   1. createDrawnFaceTargets: un rostro simple dibujado en un canvas (reserva).
//   2. createPhotoTargets:     una foto real, que la persona añade a public/faces/.

const FACE_WIDTH = 5.6; // tamaño del rostro en unidades de la escena
const FACE_HEIGHT = 7; // (la proporción ancho/alto es siempre 4:5)
const ASPECT = FACE_WIDTH / FACE_HEIGHT;

type Grid = {
  w: number;
  h: number;
  weights: Float32Array; // probabilidad relativa de cada celda
  depth: Float32Array; // z de cada celda
};

// Reparte `count` partículas según los pesos y devuelve sus posiciones (x, y, z)
// en un Float32Array de tamaño count * 3.
function sampleTargets(grid: Grid, count: number): Float32Array {
  const { w, h, weights, depth } = grid;

  // Tabla de peso acumulado: permite elegir una celda con probabilidad
  // proporcional a su peso mediante una búsqueda binaria.
  const cumulative = new Float64Array(w * h);
  let total = 0;
  for (let i = 0; i < w * h; i++) {
    total += weights[i];
    cumulative[i] = total;
  }
  if (total <= 0) throw new Error("La imagen no produjo ningún punto visible.");

  const targets = new Float32Array(count * 3);

  for (let n = 0; n < count; n++) {
    const r = Math.random() * total;

    let lo = 0;
    let hi = cumulative.length - 1;
    while (lo < hi) {
      const mid = (lo + hi) >> 1;
      if (cumulative[mid] < r) lo = mid + 1;
      else hi = mid;
    }

    // Posición dentro de la celda elegida, con un pequeño desplazamiento aleatorio.
    const px = (lo % w) + Math.random();
    const py = Math.floor(lo / w) + Math.random();

    const n3 = n * 3;
    targets[n3] = (px / w - 0.5) * FACE_WIDTH;
    targets[n3 + 1] = -(py / h - 0.5) * FACE_HEIGHT;
    targets[n3 + 2] = depth[lo] + (Math.random() - 0.5) * 0.1;
  }

  return targets;
}

function createCanvas(w: number, h: number): CanvasRenderingContext2D {
  const canvas = document.createElement("canvas");
  canvas.width = w;
  canvas.height = h;
  const g = canvas.getContext("2d", { willReadFrequently: true });
  if (!g) throw new Error("No se pudo crear el contexto 2D del canvas.");
  return g;
}

/* ------------------------------------------------------------------ */
/* 1. Rostro dibujado (reserva, no necesita ningún archivo)            */
/* ------------------------------------------------------------------ */

const DRAWN_W = 256;
const DRAWN_H = 320;
const MIN_BRIGHTNESS = 24; // los píxeles más oscuros no reciben partículas

function gray(value: number): string {
  return `rgb(${value},${value},${value})`;
}

function drawFace(g: CanvasRenderingContext2D): void {
  g.fillStyle = "#000";
  g.fillRect(0, 0, DRAWN_W, DRAWN_H);
  g.lineCap = "round";

  // Cabeza: relleno tenue y contorno brillante.
  g.beginPath();
  g.ellipse(128, 160, 78, 105, 0, 0, Math.PI * 2);
  g.fillStyle = gray(38);
  g.fill();
  g.lineWidth = 6;
  g.strokeStyle = gray(255);
  g.stroke();

  // Cejas.
  g.lineWidth = 6;
  g.strokeStyle = gray(230);
  g.beginPath();
  g.moveTo(72, 112);
  g.quadraticCurveTo(95, 100, 118, 110);
  g.stroke();
  g.beginPath();
  g.moveTo(138, 110);
  g.quadraticCurveTo(161, 100, 184, 112);
  g.stroke();

  // Ojos: contorno brillante, interior oscuro y una pupila que mira de frente.
  for (const cx of [95, 161]) {
    g.beginPath();
    g.ellipse(cx, 135, 19, 10, 0, 0, Math.PI * 2);
    g.fillStyle = gray(20);
    g.fill();
    g.lineWidth = 4;
    g.strokeStyle = gray(255);
    g.stroke();

    g.beginPath();
    g.arc(cx, 135, 6, 0, Math.PI * 2);
    g.fillStyle = gray(255);
    g.fill();
  }

  // Nariz.
  g.lineWidth = 6;
  g.strokeStyle = gray(230);
  g.beginPath();
  g.moveTo(124, 142);
  g.quadraticCurveTo(116, 170, 112, 188);
  g.quadraticCurveTo(128, 199, 144, 188);
  g.stroke();

  // Boca.
  g.lineWidth = 8;
  g.strokeStyle = gray(255);
  g.beginPath();
  g.moveTo(98, 222);
  g.quadraticCurveTo(128, 237, 158, 222);
  g.stroke();
}

export function createDrawnFaceTargets(count: number): Float32Array {
  const g = createCanvas(DRAWN_W, DRAWN_H);
  drawFace(g);
  const { data } = g.getImageData(0, 0, DRAWN_W, DRAWN_H);

  const weights = new Float32Array(DRAWN_W * DRAWN_H);
  const depth = new Float32Array(DRAWN_W * DRAWN_H);

  for (let y = 0; y < DRAWN_H; y++) {
    for (let x = 0; x < DRAWN_W; x++) {
      const i = y * DRAWN_W + x;
      const brightness = data[i * 4]; // canal rojo; dibujamos en grises
      weights[i] = brightness > MIN_BRIGHTNESS ? brightness : 0;

      // Profundidad: cabeza abombada más un relieve en la nariz.
      const nx = (x - 128) / 78;
      const ny = (y - 160) / 105;
      const dome = Math.sqrt(Math.max(0, 1 - nx * nx - ny * ny));
      const nose = Math.exp(-((x - 128) ** 2 / (2 * 14 ** 2) + (y - 168) ** 2 / (2 * 28 ** 2)));
      depth[i] = dome * 1.3 - 0.4 + nose * 0.5;
    }
  }

  return sampleTargets({ w: DRAWN_W, h: DRAWN_H, weights, depth }, count);
}

/* ------------------------------------------------------------------ */
/* 2. Foto real                                                        */
/* ------------------------------------------------------------------ */

const PHOTO_W = 320;
const PHOTO_H = 400;

// Ajustes de composición, por si la foto no tiene la cara centrada.
export type PhotoOptions = {
  focusX?: number; // centro del recorte, de 0 (izquierda) a 1 (derecha). Por defecto 0,5
  focusY?: number; // centro del recorte, de 0 (arriba) a 1 (abajo). Por defecto 0,5
  zoom?: number; // 1 = recorte 4:5 más grande posible; 1,5 = acerca un 50 %
};

// Cómo se convierte la foto en pesos. La idea es la de un dibujo a lápiz: las
// partículas ("la tinta") se reparten donde la foto es MÁS OSCURA QUE SU ENTORNO
// (ojos, cejas, boca, sombras de la nariz, línea del pelo) y en los bordes.
// Una zona lisa, como la piel o un fondo claro, apenas recibe partículas, así que
// no hace falta separar a la persona del fondo. Se puede afinar a ojo:
const MASK_RX = 0.36; // la máscara elíptica acota la cabeza: radio horizontal (0–1)
const MASK_RY = 0.36; // radio vertical
const MASK_CY = 0.46; // centro vertical de la máscara
const MASK_INNER = 0.7; // desde qué fracción del radio empieza a desvanecerse el borde
const BLUR_FINE = 1; // radios (en celdas) de los tres desenfoques de comparación
const BLUR_MID = 5;
const BLUR_WIDE = 14;
const INK_GAIN = 12; // cuánto se amplifica "más oscuro que el entorno"
const INK_GAMMA = 1.1; // >1 concentra la tinta en lo más oscuro
const EDGE_GAIN = 12; // cuánto se amplifican los bordes finos
const EDGE_WEIGHT = 0.4; // peso de los bordes frente a la tinta
const TONE_FLOOR = 0.04; // un poco de peso en las zonas claras, para dar volumen
const DEPTH_RELIEF = 0.5; // cuánto relieve añade la luminosidad

function loadImage(src: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => {
      if (img.naturalWidth > 0) resolve(img);
      else reject(new Error(`La imagen ${src} está vacía.`));
    };
    img.onerror = () => reject(new Error(`No se pudo cargar ${src}`));
    img.src = src;
  });
}

// Dibuja la foto en el canvas recortada a 4:5, con el foco y el zoom indicados.
function drawCropped(g: CanvasRenderingContext2D, img: HTMLImageElement, o: PhotoOptions) {
  const iw = img.naturalWidth;
  const ih = img.naturalHeight;
  const zoom = Math.max(1, o.zoom ?? 1);

  // Recorte 4:5 más grande que cabe en la foto, dividido por el zoom.
  let cw = iw;
  let ch = iw / ASPECT;
  if (ch > ih) {
    ch = ih;
    cw = ih * ASPECT;
  }
  cw /= zoom;
  ch /= zoom;

  // Centrado en el foco, sin salirse de la foto.
  const sx = Math.min(Math.max((o.focusX ?? 0.5) * iw - cw / 2, 0), iw - cw);
  const sy = Math.min(Math.max((o.focusY ?? 0.5) * ih - ch / 2, 0), ih - ch);

  g.fillStyle = "#000";
  g.fillRect(0, 0, PHOTO_W, PHOTO_H);
  g.drawImage(img, sx, sy, cw, ch, 0, 0, PHOTO_W, PHOTO_H);
}

// Desenfoque de caja separable (rápido): sirve para separar el detalle fino del tono general.
function boxBlur(src: Float32Array, w: number, h: number, radius: number): Float32Array {
  const tmp = new Float32Array(w * h);
  const out = new Float32Array(w * h);
  const size = radius * 2 + 1;

  for (let y = 0; y < h; y++) {
    let sum = 0;
    for (let x = -radius; x <= radius; x++) sum += src[y * w + Math.min(Math.max(x, 0), w - 1)];
    for (let x = 0; x < w; x++) {
      tmp[y * w + x] = sum / size;
      sum += src[y * w + Math.min(x + radius + 1, w - 1)];
      sum -= src[y * w + Math.max(x - radius, 0)];
    }
  }

  for (let x = 0; x < w; x++) {
    let sum = 0;
    for (let y = -radius; y <= radius; y++) sum += tmp[Math.min(Math.max(y, 0), h - 1) * w + x];
    for (let y = 0; y < h; y++) {
      out[y * w + x] = sum / size;
      sum += tmp[Math.min(y + radius + 1, h - 1) * w + x];
      sum -= tmp[Math.max(y - radius, 0) * w + x];
    }
  }

  return out;
}

function smoothstep(edge0: number, edge1: number, x: number): number {
  const t = Math.min(1, Math.max(0, (x - edge0) / (edge1 - edge0)));
  return t * t * (3 - 2 * t);
}

export async function createPhotoTargets(
  src: string,
  count: number,
  options: PhotoOptions = {}
): Promise<Float32Array> {
  const img = await loadImage(src);
  const g = createCanvas(PHOTO_W, PHOTO_H);
  drawCropped(g, img, options);
  const { data } = g.getImageData(0, 0, PHOTO_W, PHOTO_H);

  const n = PHOTO_W * PHOTO_H;
  const mask = new Float32Array(n);
  const luma = new Float32Array(n);
  const radial = new Float32Array(n); // distancia normalizada al centro de la cabeza

  for (let y = 0; y < PHOTO_H; y++) {
    for (let x = 0; x < PHOTO_W; x++) {
      const i = y * PHOTO_W + x;
      luma[i] = (0.2126 * data[i * 4] + 0.7152 * data[i * 4 + 1] + 0.0722 * data[i * 4 + 2]) / 255;

      // Máscara elíptica con borde suave: deja pasar la cabeza y apaga el fondo.
      const dx = (x / PHOTO_W - 0.5) / MASK_RX;
      const dy = (y / PHOTO_H - MASK_CY) / MASK_RY;
      const d = Math.sqrt(dx * dx + dy * dy);
      radial[i] = d;
      mask[i] = 1 - smoothstep(MASK_INNER, 1, d);
    }
  }

  // Autocontraste: estiramos el rango de luminosidad dentro de la máscara
  // (percentiles 3 y 97, para que un brillo suelto no arruine el resultado).
  const hist = new Uint32Array(256);
  let inside = 0;
  for (let i = 0; i < n; i++) {
    if (mask[i] > 0.5) {
      hist[Math.min(255, Math.floor(luma[i] * 255))]++;
      inside++;
    }
  }
  if (inside === 0) throw new Error("La máscara no cubre ningún píxel.");

  const percentile = (p: number) => {
    let acc = 0;
    for (let v = 0; v < 256; v++) {
      acc += hist[v];
      if (acc >= inside * p) return v / 255;
    }
    return 1;
  };
  const lo = percentile(0.03);
  const hi = Math.max(percentile(0.97), lo + 0.05);

  const tone = new Float32Array(n);
  for (let i = 0; i < n; i++) tone[i] = Math.min(1, Math.max(0, (luma[i] - lo) / (hi - lo)));

  // Tres versiones desenfocadas de la imagen, para comparar cada píxel con su entorno.
  const fine = boxBlur(tone, PHOTO_W, PHOTO_H, BLUR_FINE);
  const mid = boxBlur(tone, PHOTO_W, PHOTO_H, BLUR_MID);
  const wide = boxBlur(tone, PHOTO_W, PHOTO_H, BLUR_WIDE);

  const weights = new Float32Array(n);
  const depth = new Float32Array(n);

  for (let i = 0; i < n; i++) {
    // Tinta: cuánto más oscuro es este punto que el entorno amplio.
    const ink = Math.pow(Math.min(1, Math.max(0, (wide[i] - fine[i]) * INK_GAIN)), INK_GAMMA);
    // Bordes: diferencia entre el detalle fino y el entorno medio.
    const edge = Math.min(1, Math.abs(fine[i] - mid[i]) * EDGE_GAIN);

    weights[i] = mask[i] * (ink + EDGE_WEIGHT * edge + TONE_FLOOR * tone[i] * tone[i]);

    // Relieve: cabeza abombada, y las zonas más luminosas un poco más cerca
    // (usamos la versión suavizada para que la profundidad no sea ruidosa).
    const dome = Math.sqrt(Math.max(0, 1 - radial[i] * radial[i] * 0.8));
    depth[i] = dome * 1.3 - 0.4 + (wide[i] - 0.5) * DEPTH_RELIEF;
  }

  return sampleTargets({ w: PHOTO_W, h: PHOTO_H, weights, depth }, count);
}
