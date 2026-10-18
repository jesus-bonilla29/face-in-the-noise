export type MotionMode = "classic" | "flow" | "swirl";

// Una posición 3D reutilizable: [x, y, z].
export type Vec3 = [number, number, number];

// Datos que el motor entrega a la estrategia en cada fotograma.
export type ParticleContext = {
  time: number; // segundos desde que empezó la escena
  mouseX: number; // posición del cursor en el espacio de la nube
  mouseY: number;
  audioLevel: number; // 0 a 1 (por ahora siempre 0; lo conectaremos el Día 3)
};

// Datos fijos de cada partícula, calculados una sola vez al crearla.
export type ParticleSeed = {
  x: number; // posición base
  y: number;
  z: number;
  phase: number; // desfase aleatorio, 0 a 2π
  speed: number; // multiplicador de velocidad, 0.6 a 1.4
  radius: number; // distancia al eje vertical (plano xz)
  angle: number; // ángulo en el plano xz
};

// El contrato de Strategy: cada modo calcula dónde está una partícula en este instante.
export interface ParticleMotionStrategy {
  position(seed: ParticleSeed, ctx: ParticleContext, out: Vec3): void;
}
