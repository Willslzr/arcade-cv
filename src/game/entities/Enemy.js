/**
 * Enemy — nave enemiga genérica.
 *
 * El `type` (letra del atlas) sólo cambia el sprite. El patrón de
 * vuelo es una función que `WaveManager` inyecta en `reset()`: Enemy
 * no sabe distinguir "línea recta" de "picado en S", sólo ejecuta lo
 * que le dieron. Añadir un patrón nuevo es añadir una entrada a
 * `PATHS`, nunca tocar esta clase.
 *
 * Pool-friendly: nace con `alive = false`, lista para que
 * `Pool.acquire()` la reclame con `reset()`.
 */

import { Entity } from './Entity.js'
import { spriteMap } from '../config/spriteMap.js'
import { ENEMY } from '../config/balance.js'

const BLINK_MS = 260 // ritmo del parpadeo de 2 fotogramas; todos los tipos comparten uno

/**
 * Cada patrón recibe (enemy, t) y devuelve {x, y} absolutos. `t` es el
 * tiempo transcurrido desde que `WaveManager` reclamó la instancia,
 * nunca un reloj global, así que un patrón siempre empieza en t = 0.
 */
export const PATHS = {
  sweepLeftToRight(enemy, t) {
    const p = Math.min(t / enemy.duration, 1)
    return {
      x: -enemy.w + (enemy.travelW + enemy.w * 2) * p,
      y: enemy.originY + Math.sin(p * Math.PI * 4) * ENEMY.driftAmplitude,
    }
  },

  sweepRightToLeft(enemy, t) {
    const p = Math.min(t / enemy.duration, 1)
    return {
      x: enemy.travelW + enemy.w - (enemy.travelW + enemy.w * 2) * p,
      y: enemy.originY + Math.sin(p * Math.PI * 4) * ENEMY.driftAmplitude,
    }
  },

  diagonalFromLeft(enemy, t) {
    const p = Math.min(t / enemy.duration, 1)
    return {
      x: -enemy.w + (enemy.travelW * 0.7 + enemy.w) * p,
      y: enemy.originY + enemy.travelH * 0.35 * p,
    }
  },

  diagonalFromRight(enemy, t) {
    const p = Math.min(t / enemy.duration, 1)
    return {
      x: enemy.travelW + enemy.w - (enemy.travelW * 0.7 + enemy.w) * p,
      y: enemy.originY + enemy.travelH * 0.35 * p,
    }
  },

  sineDive(enemy, t) {
    const p = Math.min(t / enemy.duration, 1)
    return {
      x: enemy.originX + Math.sin(p * Math.PI * 2) * ENEMY.driftAmplitude * 2,
      y: -enemy.h + (enemy.travelH * 0.65 + enemy.h) * p,
    }
  },

  // Bucle cerrado durante la primera mitad del recorrido, caída en la
  // segunda: el rizo es lo que hace que se lea como una maniobra y no
  // como una caída con adorno.
  loopDrop(enemy, t) {
    const p = Math.min(t / enemy.duration, 1)
    const loop = Math.min(p / 0.45, 1)
    const drop = Math.max((p - 0.45) / 0.55, 0)
    return {
      x: enemy.originX + Math.sin(loop * Math.PI * 2) * ENEMY.driftAmplitude * 1.5,
      y: enemy.originY + Math.cos(loop * Math.PI * 2) * 24 - 24 + drop * enemy.travelH * 0.75,
    }
  },
}

export class Enemy extends Entity {
  constructor() {
    super()
    this.alive = false
    this.type = 'A'
    this.movement = PATHS.sweepLeftToRight
    this.duration = ENEMY.defaultPathDurationS
    this.elapsed = 0
    this.frame = 0
    this.frameClock = 0
    this.hp = ENEMY.baseHp
    this.score = ENEMY.baseScore
  }

  reset({
    x = 0,
    y = 0,
    type = 'A',
    movement = PATHS.sweepLeftToRight,
    duration = ENEMY.defaultPathDurationS,
    travelW = 0,
    travelH = 0,
  } = {}) {
    const sprite = spriteMap[`alien${type}1`]
    super.reset({ x, y, w: sprite.w * ENEMY.scale, h: sprite.h * ENEMY.scale, vx: 0, vy: 0 })

    this.originX = x
    this.originY = y
    this.travelW = travelW
    this.travelH = travelH
    this.type = type
    this.movement = movement
    this.duration = duration
    this.elapsed = 0
    this.frame = 0
    this.frameClock = 0
    this.hp = ENEMY.baseHp
    this.score = ENEMY.baseScore
    return this
  }

  /** @returns {boolean} true si el impacto la destruye. */
  takeHit(damage = 1) {
    this.hp -= damage
    if (this.hp <= 0) this.kill()
    return !this.alive
  }

  update(delta) {
    this.elapsed += delta
    this.frameClock += delta
    if (this.frameClock >= BLINK_MS / 1000) {
      this.frameClock = 0
      this.frame = this.frame ? 0 : 1
    }

    const { x, y } = this.movement(this, this.elapsed)
    this.x = x
    this.y = y

    // Ha agotado su recorrido: sale de escena aunque siga en pantalla.
    if (this.elapsed >= this.duration) this.kill()
  }

  draw(ctx, atlas) {
    if (!atlas) return
    const s = spriteMap[`alien${this.type}${this.frame + 1}`]
    ctx.drawImage(
      atlas,
      s.x, s.y, s.w, s.h,
      Math.round(this.x), Math.round(this.y),
      this.w, this.h
    )
  }
}
