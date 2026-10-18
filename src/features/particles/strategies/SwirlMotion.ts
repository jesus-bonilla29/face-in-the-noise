import { CLOUD_RADIUS } from "../../../shared/presets";
import type {
  ParticleContext,
  ParticleMotionStrategy,
  ParticleSeed,
  Vec3,
} from "../particleTypes";

// Remolino: las partículas giran alrededor del eje vertical,
// más rápido cuanto más cerca del centro están.
export class SwirlMotion implements ParticleMotionStrategy {
  position(s: ParticleSeed, ctx: ParticleContext, out: Vec3): void {
    const closeness = 1 - Math.min(s.radius / CLOUD_RADIUS, 1);
    const spin = (0.15 + 0.7 * closeness) * (1 + ctx.audioLevel);
    const a = s.angle + ctx.time * spin;

    out[0] = Math.cos(a) * s.radius;
    out[1] = s.y + Math.sin(ctx.time * 0.8 + s.phase + a) * 0.25;
    out[2] = Math.sin(a) * s.radius;
  }
}
