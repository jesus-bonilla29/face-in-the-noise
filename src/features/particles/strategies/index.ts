import type { MotionMode, ParticleMotionStrategy } from "../particleTypes";
import { ClassicMotion } from "./ClassicMotion";
import { FlowMotion } from "./FlowMotion";
import { SwirlMotion } from "./SwirlMotion";

// Un registro: del nombre del modo a su estrategia.
// Para añadir un modo nuevo basta con crear su clase y registrarla aquí.
export const strategies: Record<MotionMode, ParticleMotionStrategy> = {
  classic: new ClassicMotion(),
  flow: new FlowMotion(),
  swirl: new SwirlMotion(),
};
