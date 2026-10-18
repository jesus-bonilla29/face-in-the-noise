export type ShareOutcome = "shared" | "copied" | "cancelled" | "failed";

// Comparte el resultado: usa el menú de compartir del sistema si existe
// (móviles, Windows, Safari) y, si no, copia el mensaje al portapapeles.
export async function shareResult(count: number): Promise<ShareOutcome> {
  const text =
    count === 1 ? "I found 1 face in the noise." : `I found ${count} faces in the noise.`;
  const url = window.location.href;

  if (typeof navigator.share === "function") {
    try {
      await navigator.share({ title: "The Face in the Noise", text, url });
      return "shared";
    } catch (error) {
      // Cerrar el menú de compartir no es un error.
      if (error instanceof DOMException && error.name === "AbortError") return "cancelled";
      // Cualquier otro fallo: probamos con el portapapeles.
    }
  }

  try {
    await navigator.clipboard.writeText(`${text} ${url}`);
    return "copied";
  } catch {
    return "failed";
  }
}
