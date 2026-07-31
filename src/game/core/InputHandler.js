/**
 * InputHandler — entrada del juego, sea cual sea el dispositivo.
 *
 * Dos decisiones que arreglan problemas de la versión anterior:
 *
 * 1. Sólo se hace preventDefault cuando el juego está activo. Antes
 *    se bloqueaban las flechas y el espacio siempre, así que el
 *    visitante no podía hacer scroll por el CV con el teclado —
 *    un problema de accesibilidad, no un detalle.
 * 2. Hay `destroy()`. Sin él los listeners quedaban colgados del
 *    objeto window tras desmontar el componente.
 *
 * El táctil se suma como una fuente más de la misma API
 * (`axisX`/`axisY`/`fire`), no como un camino aparte: `setTouchAxis`
 * y `setTouchFiring` sólo escriben estado, y los getters deciden qué
 * fuente ganó. `Player` y `Engine` leen `input.axisX`/`input.fire`
 * igual que siempre — no saben si vino de una tecla o de un dedo.
 * Quien escucha eventos `touchstart/move/end` es un componente Vue
 * (`TouchControls`), nunca esta clase: aquí no hay DOM táctil, sólo
 * los dos números y el booleano que ese componente decide reportar.
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

    // Estado táctil: -1..1 continuo (el stick es analógico), no sólo
    // -1/0/1 como el teclado. Player ya multiplica el eje por la
    // velocidad máxima, así que un valor intermedio simplemente
    // mueve más despacio — no hace falta que Player lo sepa.
    this.touchAxisX = 0
    this.touchAxisY = 0
    this.touchFiring = false

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
    this.touchAxisX = 0
    this.touchAxisY = 0
    this.touchFiring = false
  }

  isPressed(...codes) {
    return codes.some((code) => this.keys[code] === true)
  }

  /** Lo que reporte `TouchControls`, sin interpretarlo: ver constructor. */
  setTouchAxis(x, y) {
    this.touchAxisX = x
    this.touchAxisY = y
  }

  setTouchFiring(value) {
    this.touchFiring = Boolean(value)
  }

  /**
   * Eje horizontal (-1..1). El teclado manda si hay algo pulsado
   * (0 es "sin pulsar", nunca un valor real de tecla); si no, el
   * valor del stick táctil, que puede quedarse en 0 sin problema.
   */
  get axisX() {
    const keyboard = (this.isPressed('ArrowRight', 'KeyD') ? 1 : 0) -
                      (this.isPressed('ArrowLeft', 'KeyA') ? 1 : 0)
    return keyboard || this.touchAxisX
  }

  /** Eje vertical (-1..1, arriba negativo). Misma prioridad que axisX. */
  get axisY() {
    const keyboard = (this.isPressed('ArrowDown', 'KeyS') ? 1 : 0) -
                      (this.isPressed('ArrowUp', 'KeyW') ? 1 : 0)
    return keyboard || this.touchAxisY
  }

  /** Botón de disparo. El cooldown lo gestiona quien lea esto, no aquí. */
  get fire() {
    return this.isPressed('Space') || this.touchFiring
  }

  destroy() {
    window.removeEventListener('keydown', this.onKeyDown)
    window.removeEventListener('keyup', this.onKeyUp)
    window.removeEventListener('blur', this.onBlur)
    this.reset()
  }
}
