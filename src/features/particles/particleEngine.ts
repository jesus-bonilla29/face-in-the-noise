import type {
  ParticleContext,
  ParticleMotionStrategy,
  ParticleSeed,
  Vec3,
} from "./particleTypes";
import { strategies } from "./strategies";

const MOUSE_RADIUS = 1.9; // hasta dónde llega la influencia del cursor
const MOUSE_FORCE = 1.4; // cuánto se desplazan las partículas
const MOUSE_SMOOTHING = 6; // cuanto mayor, más rápido reaccionan y vuelven
const MODE_TRANSITION_SECONDS = 1.2; // duración del cambio entre modos
const REVEAL_STAGGER = 0.5; // las partículas no salen todas a la vez hacia el rostro
const FACE_MORPH_SECONDS = 1.0; // duración de la transformación de un rostro en otro

function createSeeds(count: number, radius: number): ParticleSeed[] {
  const seeds: ParticleSeed[] = [];

  for (let i = 0; i < count; i++) {
    // Punto aleatorio dentro de una esfera. La raíz cúbica evita que
    // los puntos se amontonen en el centro.
    const r = radius * Math.cbrt(Math.random());
    const theta = Math.random() * Math.PI * 2;
    const phi = Math.acos(2 * Math.random() - 1);

    const x = r * Math.sin(phi) * Math.cos(theta);
    const y = r * Math.sin(phi) * Math.sin(theta);
    const z = r * Math.cos(phi);

    seeds.push({
      x,
      y,
      z,
      phase: Math.random() * Math.PI * 2,
      speed: 0.6 + Math.random() * 0.8,
      radius: Math.hypot(x, z),
      angle: Math.atan2(z, x),
    });
  }

  return seeds;
}

export class ParticleEngine {
  // Este buffer es el que lee Three.js para dibujar los puntos.
  readonly positions: Float32Array;

  private readonly count: number;
  private readonly seeds: ParticleSeed[];
  private targets: Float32Array; // posiciones que forman el rostro (cambian con setTargets)
  private readonly fromTargets: Float32Array; // el rostro anterior, mientras se transforma en el nuevo
  private faceMorph = 1; // 0 = todavía el rostro anterior, 1 = ya el nuevo
  private readonly delays: Float32Array; // retraso aleatorio de cada partícula
  private readonly offsets: Float32Array; // desplazamiento causado por el cursor

  private current: ParticleMotionStrategy = strategies.classic;
  private previous: ParticleMotionStrategy | null = null;
  private blend = 1;

  // Posiciones temporales, reutilizadas para no crear objetos en cada fotograma.
  private readonly a: Vec3 = [0, 0, 0];
  private readonly b: Vec3 = [0, 0, 0];

  constructor(count: number, cloudRadius: number, faceTargets: Float32Array) {
    this.count = count;
    this.seeds = createSeeds(count, cloudRadius);
    this.targets = faceTargets;
    this.fromTargets = new Float32Array(count * 3);
    this.positions = new Float32Array(count * 3);
    this.offsets = new Float32Array(count * 3);
    this.delays = new Float32Array(count);

    for (let i = 0; i < count; i++) {
      const seed = this.seeds[i];
      this.positions[i * 3] = seed.x;
      this.positions[i * 3 + 1] = seed.y;
      this.positions[i * 3 + 2] = seed.z;
      this.delays[i] = Math.random() * REVEAL_STAGGER;
    }
  }

  // Cambia el rostro que se formará. Se puede llamar en cualquier momento: las
  // partículas se transforman del rostro anterior al nuevo en FACE_MORPH_SECONDS
  // (con la nube dispersa el cambio ni se nota).
  setTargets(next: Float32Array): void {
    if (next.length !== this.count * 3) {
      throw new Error(`El rostro tiene ${next.length / 3} puntos y el motor ${this.count}.`);
    }
    if (next === this.targets) return;

    const from = this.fromTargets;
    const to = this.targets;
    if (this.faceMorph < 1) {
      // Ya había una transformación a medias: partimos de donde va, sin saltos.
      const s = this.faceMorph * this.faceMorph * (3 - 2 * this.faceMorph);
      for (let i = 0; i < from.length; i++) from[i] += (to[i] - from[i]) * s;
    } else {
      from.set(to);
    }

    this.targets = next;
    this.faceMorph = 0;
  }

  // Cambia de estrategia con una transición suave entre la anterior y la nueva.
  setStrategy(next: ParticleMotionStrategy): void {
    if (next === this.current) return;
    this.previous = this.current;
    this.current = next;
    this.blend = 0;
  }

  // reveal: 0 = nube dispersa, 1 = rostro completo.
  update(delta: number, ctx: ParticleContext, reveal: number, pressed: boolean): void {
    const { positions, offsets, targets, fromTargets, delays, seeds, a, b } = this;

    // Transformación de un rostro en otro (solo mientras dura).
    if (this.faceMorph < 1) {
      this.faceMorph = Math.min(1, this.faceMorph + delta / FACE_MORPH_SECONDS);
    }
    const morphing = this.faceMorph < 1;
    const fm = this.faceMorph * this.faceMorph * (3 - 2 * this.faceMorph);

    if (this.blend < 1) {
      this.blend = Math.min(1, this.blend + delta / MODE_TRANSITION_SECONDS);
    }
    const prev = this.previous;
    const mixing = prev !== null && this.blend < 1;
    const m = this.blend * this.blend * (3 - 2 * this.blend);

    // Mantener pulsado atrae las partículas; mover el cursor las repele.
    const strength = pressed ? -1.2 : 1;
    // Suavizado que no depende de los fotogramas por segundo.
    const smoothing = 1 - Math.exp(-delta * MOUSE_SMOOTHING);

    for (let i = 0; i < this.count; i++) {
      const i3 = i * 3;

      // 1. Dónde estaría la partícula como parte de la nube.
      this.current.position(seeds[i], ctx, a);
      if (mixing) {
        prev.position(seeds[i], ctx, b);
        a[0] = b[0] + (a[0] - b[0]) * m;
        a[1] = b[1] + (a[1] - b[1]) * m;
        a[2] = b[2] + (a[2] - b[2]) * m;
      }

      // 2. Cuánto avanza hacia su posición en el rostro (interpolación).
      const local = Math.min(1, Math.max(0, (reveal - delays[i]) / REVEAL_STAGGER));
      const e = local * local * (3 - 2 * local);

      let gx = targets[i3];
      let gy = targets[i3 + 1];
      let gz = targets[i3 + 2];
      if (morphing) {
        gx = fromTargets[i3] + (gx - fromTargets[i3]) * fm;
        gy = fromTargets[i3 + 1] + (gy - fromTargets[i3 + 1]) * fm;
        gz = fromTargets[i3 + 2] + (gz - fromTargets[i3 + 2]) * fm;
      }

      const x = a[0] + (gx - a[0]) * e;
      const y = a[1] + (gy - a[1]) * e;
      const z = a[2] + (gz - a[2]) * e;

      // 3. Fuerza del cursor, calculada en el plano xy.
      const dx = x - ctx.mouseX;
      const dy = y - ctx.mouseY;
      const dist2 = dx * dx + dy * dy;
      let tx = 0;
      let ty = 0;
      let tz = 0;

      if (dist2 < MOUSE_RADIUS * MOUSE_RADIUS && dist2 > 1e-6) {
        const dist = Math.sqrt(dist2);
        const falloff = 1 - dist / MOUSE_RADIUS;
        const push = falloff * falloff * strength * MOUSE_FORCE;
        // Al atraer, el desplazamiento se queda a medio camino del cursor:
        // así las partículas se concentran sin colapsar en una línea.
        const mag = Math.sign(push) * Math.min(Math.abs(push), dist * 0.55);
        tx = (dx / dist) * mag;
        ty = (dy / dist) * mag;
        tz = mag * 0.5;
      }

      // El desplazamiento se acerca poco a poco a su valor objetivo:
      // por eso las partículas vuelven suavemente cuando el cursor se aleja.
      offsets[i3] += (tx - offsets[i3]) * smoothing;
      offsets[i3 + 1] += (ty - offsets[i3 + 1]) * smoothing;
      offsets[i3 + 2] += (tz - offsets[i3 + 2]) * smoothing;

      positions[i3] = x + offsets[i3];
      positions[i3 + 1] = y + offsets[i3 + 1];
      positions[i3 + 2] = z + offsets[i3 + 2];
    }

    if (this.blend >= 1) this.previous = null;
  }
}
