import type {
  ParticleContext,
  ParticleMotionStrategy,
  ParticleSeed,
  Vec3,
} from "../particleTypes";

// Movimiento orgánico: cada partícula flota alrededor de su posición base,
// como polvo suspendido en el aire.
export class ClassicMotion implements ParticleMotionStrategy {
  position(s: ParticleSeed, ctx: ParticleContext, out: Vec3): void {
    const t = ctx.time * s.speed;
    const amp = 0.18 * (1 + ctx.audioLevel);

    out[0] =
      s.x + Math.sin(t * 0.6 + s.phase) * amp + Math.sin(t * 0.23 + s.y * 1.7) * amp * 0.6;
    out[1] =
      s.y + Math.cos(t * 0.5 + s.phase * 1.3) * amp + Math.sin(t * 0.31 + s.z * 1.9) * amp * 0.6;
    out[2] = s.z + Math.sin(t * 0.45 + s.phase * 0.7 + s.x * 1.1) * amp;
  }
}
