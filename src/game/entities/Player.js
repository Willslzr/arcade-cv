/**
 * Player — la nave del jugador.
 *
 * Movimiento con aceleración e inercia en lugar de desplazamiento
 * directo: una nave que arranca y frena de golpe se siente barata.
 * El sprite cambia de fotograma según el eje horizontal (inclinación),
 * que es lo que hace legible el control sin explicar nada.
 */

import { Entity } from './Entity.js'
import { spriteMap } from '../config/spriteMap.js'
import { PLAYER } from '../config/balance.js'

export class Player extends Entity {
  constructor(width, height) {
    const sprite = spriteMap.player
    super({
      w: sprite.w * PLAYER.scale,
      h: sprite.h * PLAYER.scale,
    })

    this.tilt = 0        // -1 izquierda · 0 centro · 1 derecha
    this.entering = false
    this.engineFrame = 0
    this.engineClock = 0

    this.resize(width, height)
  }

  resize(width, height) {
    const ratioX = this.viewW ? this.x / this.viewW : 0.5 - this.w / 2 / width
    this.viewW = width
    this.viewH = height
    this.restY = height - this.h - PLAYER.bottomMargin
    this.x = Math.min(Math.max(0, ratioX * width), width - this.w)
    if (!this.entering) this.y = Math.min(this.y || this.restY, this.restY)
  }

  /** Entrada cinemática: la nave sube desde fuera de pantalla. */
  enter() {
    this.entering = true
    this.y = this.viewH + this.h
    this.x = this.viewW / 2 - this.w / 2
    this.vx = 0
    this.vy = 0
    this.alive = true
  }

  update(delta, input, width, height) {
    this.viewW = width
    this.viewH = height
    this.restY = height - this.h - PLAYER.bottomMargin

    this.animateEngine(delta)

    if (this.entering) {
      this.y -= PLAYER.entrySpeed * delta
      if (this.y <= this.restY) {
        this.y = this.restY
        this.entering = false
      }
      return // sin control durante la cinemática
    }

    const ax = input.axisX
    const ay = input.axisY
    this.tilt = ax

    // Aceleración hacia la velocidad objetivo, con rozamiento
    // cuando no se pulsa nada.
    const targetVX = ax * PLAYER.maxSpeed
    const targetVY = ay * PLAYER.maxSpeed
    const rate = (ax || ay) ? PLAYER.accel : PLAYER.friction

    this.vx += (targetVX - this.vx) * Math.min(1, rate * delta)
    this.vy += (targetVY - this.vy) * Math.min(1, rate * delta)

    this.x += this.vx * delta
    this.y += this.vy * delta

    this.clampToView()
  }

  clampToView() {
    if (this.x < 0) { this.x = 0; this.vx = 0 }
    if (this.x > this.viewW - this.w) { this.x = this.viewW - this.w; this.vx = 0 }
    // Techo de movimiento: la nave no sube más allá del 45% de la
    // pantalla, para que los enemigos siempre tengan espacio.
    const top = this.viewH * PLAYER.ceilingRatio
    if (this.y < top) { this.y = top; this.vy = 0 }
    if (this.y > this.viewH - this.h) { this.y = this.viewH - this.h; this.vy = 0 }
  }

  animateEngine(delta) {
    this.engineClock += delta
    if (this.engineClock >= PLAYER.engineFrameMs / 1000) {
      this.engineClock = 0
      this.engineFrame = (this.engineFrame + 1) % 3
    }
  }

  get spriteKey() {
    if (this.tilt < 0) return 'playerleft'
    if (this.tilt > 0) return 'playerright'
    return 'player'
  }

  draw(ctx, atlas) {
    if (!atlas) return

    // Llama del motor, detrás del casco
    const engineKeys = ['engine', 'engine2', 'engine3']
    const flame = spriteMap[engineKeys[this.engineFrame]]
    if (flame) {
      const fw = flame.w * PLAYER.scale
      const fh = flame.h * PLAYER.scale
      ctx.drawImage(
        atlas,
        flame.x, flame.y, flame.w, flame.h,
        Math.round(this.centerX - fw / 2), Math.round(this.y + this.h - PLAYER.scale),
        fw, fh
      )
    }

    const s = spriteMap[this.spriteKey]
    ctx.drawImage(
      atlas,
      s.x, s.y, s.w, s.h,
      Math.round(this.x), Math.round(this.y),
      this.w, this.h
    )
  }
}
