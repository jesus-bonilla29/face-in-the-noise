import { useEffect, useRef, useState } from "react";
import { shareResult } from "./shareResult";

const MESSAGES = {
  copied: "Copied to clipboard",
  failed: "Couldn't share",
} as const;

type Props = {
  count: number;
};

// Muestra cuántos rostros ha encontrado la persona y permite compartir el resultado.
export function FaceCounter({ count }: Props) {
  const [message, setMessage] = useState<string | null>(null);
  const timer = useRef<number | undefined>(undefined);

  // Al desmontar, cancelamos el aviso pendiente.
  useEffect(() => () => window.clearTimeout(timer.current), []);

  const onShare = async () => {
    const outcome = await shareResult(count);
    if (outcome !== "copied" && outcome !== "failed") return;

    setMessage(MESSAGES[outcome]);
    window.clearTimeout(timer.current);
    timer.current = window.setTimeout(() => setMessage(null), 2200);
  };

  return (
    <div className="face-counter">
      <div className="face-counter__count">
        <span className="face-counter__label">Faces found</span>
        <span className="face-counter__value" aria-live="polite">
          {count}
        </span>
      </div>

      <button
        type="button"
        className="control-button control-button--small"
        onClick={onShare}
        disabled={count === 0}
        title={count === 0 ? "Find a face first" : "Share your result"}
      >
        Share
      </button>

      <span className="face-counter__message" role="status">
        {message}
      </span>
    </div>
  );
}
