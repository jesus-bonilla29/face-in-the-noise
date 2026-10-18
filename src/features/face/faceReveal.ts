const FIRST_REVEAL_SECONDS = 5; // el primer rostro aparece pronto, para que se descubra
const IDLE_MIN_SECONDS = 10; // espera entre apariciones
const IDLE_MAX_SECONDS = 16;
const HOLD_SECONDS = 5; // cuánto tiempo permanece visible
const FORM_SPEED = 1.6; // velocidad al formarse
const DISPERSE_SPEED = 1.0; // velocidad al desintegrarse

// Decide cuándo aparece el rostro. No sabe nada de partículas ni de Three.js:
// solo devuelve un número de 0 (nube dispersa) a 1 (rostro completo).
export class FaceRevealController {
  private target = 0;
  private amount = 0;
  private timer = FIRST_REVEAL_SECONDS;
  private startPending = false;

  // Se llama en cada fotograma con el tiempo transcurrido en segundos.
  update(delta: number): number {
    this.timer -= delta;

    if (this.timer <= 0) {
      if (this.target === 0) {
        this.target = 1;
        this.startPending = true;
        this.timer = HOLD_SECONDS;
      } else {
        this.target = 0;
        this.timer =
          IDLE_MIN_SECONDS + Math.random() * (IDLE_MAX_SECONDS - IDLE_MIN_SECONDS);
      }
    }

    const speed = this.target === 1 ? FORM_SPEED : DISPERSE_SPEED;
    this.amount += (this.target - this.amount) * (1 - Math.exp(-speed * delta));
    return this.amount;
  }

  // Fuerza la aparición ahora mismo (botón "Reveal face").
  trigger(): void {
    if (this.target === 0) this.startPending = true;
    this.target = 1;
    this.timer = HOLD_SECONDS;
  }

  // Devuelve true una sola vez cada vez que EMPIEZA una aparición nueva.
  // Sirve para elegir qué rostro toca mostrar.
  consumeStart(): boolean {
    const started = this.startPending;
    this.startPending = false;
    return started;
  }
}
