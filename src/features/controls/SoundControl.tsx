import { useState } from "react";
import type { AudioAnalyzer } from "../audio/AudioAnalyzer";

type Status = "off" | "on" | "error";

type Props = {
  analyzer: AudioAnalyzer;
};

// Botón para activar y desactivar el sonido. El audio nunca arranca solo:
// empieza cuando la persona hace clic.
export function SoundControl({ analyzer }: Props) {
  const [status, setStatus] = useState<Status>("off");

  const toggle = async () => {
    if (status === "on") {
      analyzer.stop();
      setStatus("off");
      return;
    }
    try {
      await analyzer.start();
      setStatus("on");
    } catch {
      setStatus("error");
    }
  };

  const label =
    status === "on" ? "Sound on" : status === "error" ? "Sound unavailable" : "Sound off";

  return (
    <button
      type="button"
      className="control-button"
      aria-pressed={status === "on"}
      onClick={toggle}
    >
      {label}
    </button>
  );
}
