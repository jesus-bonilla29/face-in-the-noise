import { Canvas, useFrame } from "@react-three/fiber";
import type { PerspectiveCamera } from "three";
import { MathUtils } from "three";
import { CAMERA_Z, VIEW_WIDTH } from "../../../shared/presets";
import type { MotionMode } from "../particleTypes";
import { ParticleCloud } from "./ParticleCloud";

// En una pantalla estrecha (móvil en vertical) el rostro no cabría a la distancia
// base, así que la cámara se aleja lo justo para que siempre se vea completo.
function ResponsiveCamera() {
  useFrame((state) => {
    const camera = state.camera as PerspectiveCamera;
    const aspect = state.size.width / state.size.height;
    const halfFov = MathUtils.degToRad(camera.fov / 2);
    const needed = VIEW_WIDTH / (2 * Math.tan(halfFov) * aspect);
    const z = Math.max(CAMERA_Z, needed);

    // Solo se toca la cámara cuando la distancia realmente cambia.
    if (Math.abs(camera.position.z - z) > 1e-3) camera.position.z = z;
  });

  return null;
}

type Props = {
  mode: MotionMode;
  revealTrigger: number;
  getAudioLevel: () => number;
  onFaceVisibleChange: (visible: boolean) => void;
};

export function ParticleScene({
  mode,
  revealTrigger,
  getAudioLevel,
  onFaceVisibleChange,
}: Props) {
  return (
    <Canvas
      camera={{ position: [0, 0, CAMERA_Z], fov: 60 }}
      dpr={[1, 2]}
      gl={{ antialias: true }}
    >
      {/* Fondo negro de la escena */}
      <color attach="background" args={["#000000"]} />

      <ResponsiveCamera />
      <ParticleCloud
        mode={mode}
        revealTrigger={revealTrigger}
        getAudioLevel={getAudioLevel}
        onFaceVisibleChange={onFaceVisibleChange}
      />
    </Canvas>
  );
}
