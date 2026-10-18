// Adapter: aísla la Web Audio API del resto de la aplicación.
// El motor de partículas solo necesita saber "qué tan fuerte suena".

export interface AudioAnalyzer {
  getLevel(): number; // Valor normalizado de 0 a 1.
  start(): Promise<void>;
  stop(): void;
}

const LOW_BINS = 24; // los primeros bins son los graves (~0 a 1 kHz): donde está el pulso
const LEVEL_GAIN = 2.2; // amplifica el promedio, que suele ser bajo
const ATTACK = 0.55; // cuánto sube el nivel suavizado hacia un valor mayor
const RELEASE = 0.08; // cuánto baja hacia un valor menor (más lento: efecto de eco)

export class WebAudioAnalyzer implements AudioAnalyzer {
  private context: AudioContext | null = null;
  private analyser: AnalyserNode | null = null;
  private element: HTMLAudioElement | null = null;
  private data: Uint8Array<ArrayBuffer> | null = null;
  private level = 0;
  private readonly src: string;

  // (Sin "private readonly" en el parámetro: la plantilla de Vite activa
  // erasableSyntaxOnly, que no permite esa abreviatura.)
  constructor(src: string) {
    this.src = src;
  }

  // Debe llamarse desde un gesto del usuario (un clic): los navegadores
  // bloquean el audio automático.
  async start(): Promise<void> {
    if (!this.context) this.build();
    await this.context!.resume();
    await this.element!.play();
  }

  stop(): void {
    this.element?.pause();
    this.level = 0;
    void this.context?.suspend();
  }

  getLevel(): number {
    const analyser = this.analyser;
    const data = this.data;
    if (!analyser || !data || this.element?.paused) {
      // En pausa el nivel decae suavemente hacia 0.
      this.level += (0 - this.level) * RELEASE;
      return this.level;
    }

    analyser.getByteFrequencyData(data);
    let sum = 0;
    for (let i = 0; i < LOW_BINS; i++) sum += data[i];
    const raw = Math.min(1, (sum / LOW_BINS / 255) * LEVEL_GAIN);

    // Sube rápido, baja despacio: así los golpes se notan y no parpadean.
    const k = raw > this.level ? ATTACK : RELEASE;
    this.level += (raw - this.level) * k;
    return this.level;
  }

  private build(): void {
    const AudioCtx =
      window.AudioContext ??
      (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;

    const context = new AudioCtx();
    const element = new Audio(this.src);
    element.loop = true;
    element.crossOrigin = "anonymous";

    const analyser = context.createAnalyser();
    analyser.fftSize = 256;
    analyser.smoothingTimeConstant = 0.75;

    // archivo → analizador → altavoces
    context.createMediaElementSource(element).connect(analyser);
    analyser.connect(context.destination);

    this.context = context;
    this.element = element;
    this.analyser = analyser;
    this.data = new Uint8Array(analyser.frequencyBinCount);
  }
}

// Se usa cuando el navegador no tiene Web Audio: la aplicación sigue funcionando, en silencio.
export class SilentAnalyzer implements AudioAnalyzer {
  getLevel(): number {
    return 0;
  }
  async start(): Promise<void> {
    throw new Error("Web Audio no está disponible en este navegador.");
  }
  stop(): void {}
}

export function createAudioAnalyzer(src: string): AudioAnalyzer {
  const supported =
    typeof window !== "undefined" &&
    ("AudioContext" in window || "webkitAudioContext" in window);
  return supported ? new WebAudioAnalyzer(src) : new SilentAnalyzer();
}
