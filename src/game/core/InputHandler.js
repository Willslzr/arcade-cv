/**
 * InputHandler — captura de teclado para el juego.
 *
 * Dos decisiones que arreglan problemas de la versión anterior:
 *
 * 1. Sólo se hace preventDefault cuando el juego está activo. Antes
 *    se bloqueaban las flechas y el espacio siempre, así que el
 *    visitante no podía hacer scroll por el CV con el teclado —
 *    un problema de accesibilidad, no un detalle.
 * 2. Hay `destroy()`. Sin él los listeners quedaban colgados del
 *    objeto window tras desmontar el componente.
 */

const GAME_KEYS = new Set([
  'ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight',
  'KeyW', 'KeyA', 'KeyS', 'KeyD',
  'Space', 'KeyR', 'Escape', 'Enter',
])

export class InputHandler {
  constructor() {
    /** @type {Record<string, boolean>} */
    this.keys = Object.create(null)
    /** Cuando es false, el teclado pertenece a la página, no al juego. */
    this.capturing = false

    this.onKeyDown = this.onKeyDown.bind(this)
    this.onKeyUp = this.onKeyUp.bind(this)
    this.onBlur = this.onBlur.bind(this)

    window.addEventListener('keydown', this.onKeyDown)
    window.addEventListener('keyup', this.onKeyUp)
    // Si el usuario cambia de pestaña con una tecla pulsada, el
    // keyup nunca llega y la nave se quedaría a la deriva.
    window.addEventListener('blur', this.onBlur)
  }

  setCapturing(value) {
    this.capturing = Boolean(value)
    if (!this.capturing) this.reset()
  }

  onKeyDown(e) {
    if (this.capturing && GAME_KEYS.has(e.code)) e.preventDefault()
    this.keys[e.code] = true
  }

  onKeyUp(e) {
    if (this.capturing && GAME_KEYS.has(e.code)) e.preventDefault()
    this.keys[e.code] = false
  }

  onBlur() {
    this.reset()
  }

  reset() {
    this.keys = Object.create(null)
  }

  isPressed(...codes) {
    return codes.some((code) => this.keys[code] === true)
  }

  /** Eje horizontal normalizado (-1, 0, 1). Flechas o WASD. */
  get axisX() {
    return (this.isPressed('ArrowRight', 'KeyD') ? 1 : 0) -
           (this.isPressed('ArrowLeft', 'KeyA') ? 1 : 0)
  }

  /** Eje vertical normalizado (-1 arriba, 1 abajo). */
  get axisY() {
    return (this.isPressed('ArrowDown', 'KeyS') ? 1 : 0) -
           (this.isPressed('ArrowUp', 'KeyW') ? 1 : 0)
  }

  /** Botón de disparo. El cooldown lo gestiona quien lea esto, no aquí. */
  get fire() {
    return this.isPressed('Space')
  }

  destroy() {
    window.removeEventListener('keydown', this.onKeyDown)
    window.removeEventListener('keyup', this.onKeyUp)
    window.removeEventListener('blur', this.onBlur)
    this.reset()
  }
}
