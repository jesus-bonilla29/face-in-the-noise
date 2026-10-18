import { CLOUD_RADIUS } from "../../../shared/presets";
import type {
  ParticleContext,
  ParticleMotionStrategy,
  ParticleSeed,
  Vec3,
} from "../particleTypes";

// Lleva un valor al rango [-r, r), de modo que al salir por un lado reaparece por el otro.
function wrap(value: number, r: number): number {
  const span = 2 * r;
  return ((((value + r) % span) + span) % span) - r;
}

// Flujo continuo: las partículas avanzan por el eje x como una corriente
// que serpentea hacia arriba y hacia abajo.
export class FlowMotion implements ParticleMotionStrategy {
  position(s: ParticleSeed, ctx: ParticleContext, out: Vec3): void {
    const travel = ctx.time * 0.4 * s.speed * (1 + ctx.audioLevel);
    const x = wrap(s.x + travel, CLOUD_RADIUS);

    out[0] = x;
    out[1] = s.y + Math.sin(x * 1.1 + s.phase + ctx.time * 0.5) * 0.35;
    out[2] = s.z + Math.cos(x * 0.9 + s.phase * 0.6 + ctx.time * 0.4) * 0.35;
  }
}
