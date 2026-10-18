import { useCallback, useState } from "react";

const STORAGE_KEY = "face-in-the-noise:found";

// localStorage puede no existir (modo privado, datos bloqueados): en ese caso
// el contador funciona igual, solo que no se conserva al recargar.
function readStored(): number {
  try {
    const value = Number(window.localStorage.getItem(STORAGE_KEY));
    return Number.isFinite(value) && value > 0 ? Math.floor(value) : 0;
  } catch {
    return 0;
  }
}

function writeStored(value: number): void {
  try {
    window.localStorage.setItem(STORAGE_KEY, String(value));
  } catch {
    // Sin almacenamiento: se ignora.
  }
}

// Cuenta los rostros que la persona dice haber encontrado.
export function useFoundCount() {
  const [count, setCount] = useState(readStored);

  const increment = useCallback(() => {
    setCount((current) => {
      const next = current + 1;
      writeStored(next);
      return next;
    });
  }, []);

  return { count, increment };
}
