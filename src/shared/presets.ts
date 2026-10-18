// Valores compartidos por varias partes de la aplicación.

// Con fotos reales hacen falta muchas partículas para que el rostro se reconozca:
// con 6.000 se adivina, con más de 12.000 se distingue bien. El motor cuesta unos
// 2 ms por fotograma con 20.000 partículas (medido en un procesador de escritorio).
export const PARTICLE_COUNT = 18000;
export const MOBILE_PARTICLE_COUNT = 8000;
export const CLOUD_RADIUS = 3;

// Cámara: distancia base y ancho de escena que debe caber siempre en pantalla.
// La cabeza del rostro mide unas 3,4 unidades de ancho, así que 5,2 la deja ocupando
// dos tercios de una pantalla vertical. La nube (6 de diámetro) puede salirse un poco
// por los lados: allí es muy dispersa y el efecto es más envolvente.
export const CAMERA_Z = 7;
export const VIEW_WIDTH = 5.2;

// Pantallas pequeñas o táctiles: menos partículas para mantener la fluidez.
export function getParticleCount(): number {
  const small = window.matchMedia("(max-width: 700px), (pointer: coarse)").matches;
  return small ? MOBILE_PARTICLE_COUNT : PARTICLE_COUNT;
}

export const AUDIO_SRC = `${import.meta.env.BASE_URL}audio/ambient.mp3`;

// Paleta neón: azul, violeta y magenta.
export const PALETTE_HEX = ["#3b82f6", "#8b5cf6", "#ec4899"] as const;
