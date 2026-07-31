/**
 * Starfield — fondo de estrellas con paralaje en tres capas.
 *
 * Corre desde el primer segundo, detrás del CV. Es el elemento que
 * hace que la transición a pantalla completa no tenga corte visual:
 * el fondo ya estaba ahí.
 *
 * En fase de juego acelera; en el CV va lento para no distraer de
 * la lectura. Ese cambio de velocidad es la única señal ambiental
 * de que algo va a pasar.
 */

const LAYERS = [
  { count: 46, size: 1, speed: 14, alpha: 0.30 },
  { count: 30, size: 2, speed: 30, alpha: 0.55 },
  { count: 16, size: 3, speed: 58, alpha: 0.90 },
]

const PHASE_SPEED = {
  idle: 1,
  glitch: 3.2,
  game: 5,
  over: 0.6,
}

export class Starfield {
  constructor(width, height) {
    this.width = width
    this.height = height
    this.speedFactor = 1
    this.stars = []
    this.populate()
  }

  populate() {
    this.stars = []
    for (const layer of LAYERS) {
      for (let i = 0; i < layer.count; i++) {
        this.stars.push({
          x: Math.random() * this.width,
          y: Math.random() * this.height,
          size: layer.size,
          speed: layer.speed * (0.8 + Math.random() * 0.4),
          alpha: layer.alpha,
        })
      }
    }
  }

  /**
   * Reubica las estrellas proporcionalmente al nuevo tamaño para
   * que un resize no las amontone en una esquina.
   */
  resize(width, height) {
    const sx = width / this.width
    const sy = height / this.height
    this.width = width
    this.height = height
    for (const star of this.stars) {
      star.x *= sx
      star.y *= sy
    }
  }

  update(delta, phase = 'idle') {
    const target = PHASE_SPEED[phase] ?? 1
    // Interpolación exponencial: el cambio de velocidad se siente
    // como una aceleración, no como un salto.
    this.speedFactor += (target - this.speedFactor) * Math.min(1, delta * 2.5)

    for (const star of this.stars) {
      star.y += star.speed * this.speedFactor * delta
      if (star.y > this.height) {
        star.y -= this.height
        star.x = Math.random() * this.width
      }
    }
  }

  draw(ctx) {
    // Agrupamos por alpha para minimizar cambios de estado del
    // contexto: cada asignación de globalAlpha tiene coste.
    let currentAlpha = -1
    ctx.fillStyle = '#d9e6e2'
    for (const star of this.stars) {
      if (star.alpha !== currentAlpha) {
        ctx.globalAlpha = star.alpha
        currentAlpha = star.alpha
      }
      ctx.fillRect(star.x | 0, star.y | 0, star.size, star.size)
    }
    ctx.globalAlpha = 1
  }
}
