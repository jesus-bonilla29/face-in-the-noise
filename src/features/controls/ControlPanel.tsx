import type { ReactNode } from "react";
import type { MotionMode } from "../particles/particleTypes";

const MODES: { id: MotionMode; label: string }[] = [
  { id: "classic", label: "Classic" },
  { id: "flow", label: "Flow" },
  { id: "swirl", label: "Swirl" },
];

type Props = {
  mode: MotionMode;
  onModeChange: (mode: MotionMode) => void;
  onReveal: () => void;
  children?: ReactNode; // controles adicionales, como el del sonido
};

// Solo captura acciones del usuario: no sabe nada de partículas ni de 3D.
export function ControlPanel({ mode, onModeChange, onReveal, children }: Props) {
  return (
    <div className="control-panel">
      <div className="control-panel__modes" role="group" aria-label="Particle mode">
        {MODES.map(({ id, label }) => (
          <button
            key={id}
            type="button"
            className="control-button"
            aria-pressed={mode === id}
            onClick={() => onModeChange(id)}
          >
            {label}
          </button>
        ))}
      </div>

      <div className="control-panel__actions">
        <button
          type="button"
          className="control-button control-button--accent"
          onClick={onReveal}
        >
          Reveal face
        </button>
        {children}
      </div>
    </div>
  );
}
