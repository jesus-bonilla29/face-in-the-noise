import { useCallback, useEffect, useState } from "react";
import { createAudioAnalyzer } from "../features/audio/AudioAnalyzer";
import { ControlPanel } from "../features/controls/ControlPanel";
import { FaceCounter } from "../features/controls/FaceCounter";
import { FoundButton } from "../features/controls/FoundButton";
import { SoundControl } from "../features/controls/SoundControl";
import { useFoundCount } from "../features/controls/useFoundCount";
import { ParticleScene } from "../features/particles/components/ParticleScene";
import type { MotionMode } from "../features/particles/particleTypes";
import { AUDIO_SRC } from "../shared/presets";

export default function App() {
  // Estado de React solo para decisiones de interfaz, nunca para el movimiento.
  const [mode, setMode] = useState<MotionMode>("classic");
  const [revealTrigger, setRevealTrigger] = useState(0);
  const [faceVisible, setFaceVisible] = useState(false);
  const [claimed, setClaimed] = useState(false); // ¿ya se registró esta aparición?
  const { count, increment } = useFoundCount();

  // El analizador de audio se crea una sola vez. El resto de la aplicación
  // solo conoce su interfaz: getLevel(), start() y stop().
  const [analyzer] = useState(() => createAudioAnalyzer(AUDIO_SRC));
  const getAudioLevel = useCallback(() => analyzer.getLevel(), [analyzer]);
  useEffect(() => () => analyzer.stop(), [analyzer]);

  // Cada vez que el rostro aparece, se puede registrar de nuevo.
  const handleFaceVisible = useCallback((visible: boolean) => {
    setFaceVisible(visible);
    if (visible) setClaimed(false);
  }, []);

  const handleFound = () => {
    increment();
    setClaimed(true);
  };

  const foundState = !faceVisible ? "hidden" : claimed ? "logged" : "available";

  return (
    <div className="app">
      <ParticleScene
        mode={mode}
        revealTrigger={revealTrigger}
        getAudioLevel={getAudioLevel}
        onFaceVisibleChange={handleFaceVisible}
      />

      <h1 className="title">The Face in the Noise</h1>
      <p className="hint">Move or touch · hold to attract</p>

      <FaceCounter count={count} />

      <div className="dock">
        <FoundButton state={foundState} onFound={handleFound} />
        <ControlPanel
          mode={mode}
          onModeChange={setMode}
          onReveal={() => setRevealTrigger((n) => n + 1)}
        >
          <SoundControl analyzer={analyzer} />
        </ControlPanel>
      </div>
    </div>
  );
}
