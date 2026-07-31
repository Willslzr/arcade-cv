/**
 * Boss — vida múltiple, patrulla horizontal, tres fases por vida.
 *
 * Única (no vive en un Pool: sólo hay un jefe por partida). El cambio
 * de fase según `BOSS.phaseHpRatios` no reescribe el movimiento: sólo
 * cambia dos multiplicadores (velocidad de patrulla, amplitud del
 * balanceo vertical) que alimentan la misma fórmula. Es intensidad
 * creciente, no un comportamiento distinto por fase.
 *
 * `boss4` no es una cuarta fase: es el fotograma de flash al recibir
 * impacto, así se usan los cuatro sprites del atlas sin inventar un
 * umbral de vida que `BOSS.phaseHpRatios` no define.
 */

import { Entity } from './Entity.js'
import { spriteMap } from '../config/spriteMap.js'
import { BOSS } from '../config/balance.js'

const PHASE_SPRITES = ['boss', 'boss2', 'boss3']
const HIT_FLASH_SPRITE = 'boss4'
const HIT_FLASH_S = 0.08
const PHASE_SPEED_MULT = [1, 1.4, 1.85]
const PHASE_BOB_AMPLITUDE = [0, 24, 48]

function patrol(boss, t) {
  const omega = (BOSS.speed * PHASE_SPEED_MULT[boss.phase]) / boss.bandHalfW
  const bob = PHASE_BOB_AMPLITUDE[boss.phase]
  return {
    x: boss.bandCenterX + Math.sin(t * omega) * boss.bandHalfW,
    y: boss.restY + (bob ? Math.sin(t * omega * 2) * bob : 0),
  }
}

export class Boss extends Entity {
  constructor(width, height) {
    const sprite = spriteMap.boss
    super({ w: sprite.w * BOSS.scale, h: sprite.h * BOSS.scale })

    this.hp = BOSS.hp
    this.maxHp = BOSS.hp
    this.phase = 0
    this.elapsed = 0
    this.hitFlash = 0
    this.entering = true

    this.resize(width, height)
    this.x = this.bandCenterX
    this.y = -this.h
  }

  resize(width, height) {
    const margin = this.w * 0.6
    this.bandHalfW = Math.max(40, width / 2 - margin - this.w / 2)
    this.bandCenterX = width / 2 - this.w / 2
    this.restY = height * 0.16
    if (!this.entering) this.y = Math.min(this.y, height - this.h)
  }

  /** Entrada cinemática: desciende desde fuera de pantalla, como Player.enter(). */
  enter() {
    this.entering = true
    this.elapsed = 0
    this.x = this.bandCenterX
    this.y = -this.h
    this.alive = true
  }

  /** @returns {boolean} true si el impacto lo destruye. */
  takeHit(damage = 1) {
    this.hp = Math.max(0, this.hp - damage)
    this.hitFlash = HIT_FLASH_S
    this.updatePhase()
    if (this.hp <= 0) this.kill()
    return !this.alive
  }

  updatePhase() {
    const ratio = this.hp / this.maxHp
    // phaseHpRatios va de mayor a menor umbral; la fase activa es el
    // último que la vida restante todavía no ha cruzado por debajo.
    let phase = 0
    for (let i = 0; i < BOSS.phaseHpRatios.length; i += 1) {
      if (ratio <= BOSS.phaseHpRatios[i]) phase = i
    }
    this.phase = phase
  }

  update(delta) {
    this.hitFlash = Math.max(0, this.hitFlash - delta)

    if (this.entering) {
      this.y += BOSS.entrySpeed * delta
      if (this.y >= this.restY) {
        this.y = this.restY
        this.entering = false
      }
      return
    }

    this.elapsed += delta
    const { x, y } = patrol(this, this.elapsed)
    this.x = x
    this.y = y
  }

  draw(ctx, atlas) {
    if (!atlas) return
    const key = this.hitFlash > 0 ? HIT_FLASH_SPRITE : PHASE_SPRITES[this.phase]
    const s = spriteMap[key]
    ctx.drawImage(
      atlas,
      s.x, s.y, s.w, s.h,
      Math.round(this.x), Math.round(this.y),
      this.w, this.h
    )
  }
}
