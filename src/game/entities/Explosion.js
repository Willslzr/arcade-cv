/**
 * Explosion — animación de 3 fotogramas del atlas que se auto-destruye.
 *
 * `x, y` son el centro, no la esquina: quien la crea normalmente tiene
 * `centerX`/`centerY` de la nave destruida a mano, y así no hace falta
 * que reste medio sprite antes de llamar a `reset()`.
 *
 * Pool-friendly como Projectile y Enemy: nace `alive = false`.
 */

import { Entity } from './Entity.js'
import { spriteMap } from '../config/spriteMap.js'
import { EXPLOSION } from '../config/balance.js'

const FRAMES = ['explosion', 'explosion2', 'explosion3']

export class Explosion extends Entity {
  constructor() {
    super()
    this.alive = false
    this.frame = 0
    this.frameClock = 0
  }

  reset({ x = 0, y = 0, scale = EXPLOSION.scale } = {}) {
    const sprite = spriteMap[FRAMES[0]]
    super.reset({ x, y, w: sprite.w * scale, h: sprite.h * scale, vx: 0, vy: 0 })
    this.frame = 0
    this.frameClock = 0
    return this
  }

  update(delta) {
    this.frameClock += delta
    if (this.frameClock < EXPLOSION.frameMs / 1000) return

    this.frameClock = 0
    this.frame += 1
    // Fin de la animación: no hay un cuarto fotograma que dibujar.
    if (this.frame >= FRAMES.length) this.kill()
  }

  draw(ctx, atlas) {
    if (!atlas || this.frame >= FRAMES.length) return
    const s = spriteMap[FRAMES[this.frame]]
    ctx.drawImage(
      atlas,
      s.x, s.y, s.w, s.h,
      Math.round(this.x - this.w / 2), Math.round(this.y - this.h / 2),
      this.w, this.h
    )
  }
}
