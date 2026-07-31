/**
 * Projectile — un solo tipo para disparo del jugador y del enemigo.
 *
 * La diferencia entre "bala del jugador" y "bala enemiga" es dirección,
 * sprite y contra quién colisiona: no justifica dos clases. `faction`
 * decide las tres cosas en `reset()`, que es lo que llama el Pool al
 * reciclar la instancia.
 *
 * Empieza `alive = false`: recién salida de fábrica no representa
 * ningún disparo real, así que el Pool debe poder encontrarla como
 * libre antes de que nadie la reclame.
 */

import { Entity } from './Entity.js'
import { spriteMap } from '../config/spriteMap.js'
import { PROJECTILE } from '../config/balance.js'

const FACTION = {
  player: { sprite: 'laser', scale: PROJECTILE.playerScale, vy: PROJECTILE.playerSpeed },
  enemy: { sprite: 'enemyLaser', scale: PROJECTILE.enemyScale, vy: PROJECTILE.enemySpeed },
}

export class Projectile extends Entity {
  constructor() {
    super()
    this.alive = false
    this.faction = 'player'
    this.sprite = null
  }

  reset({ x = 0, y = 0, faction = 'player' } = {}) {
    const def = FACTION[faction]
    const sprite = spriteMap[def.sprite]

    super.reset({ x, y, vx: 0, vy: def.vy, w: sprite.w * def.scale, h: sprite.h * def.scale })
    this.faction = faction
    this.sprite = sprite
    return this
  }

  /** Fuera de la pantalla (arriba o abajo) es fin de vida, no impacto. */
  update(delta, viewHeight) {
    this.y += this.vy * delta
    if (this.y + this.h < 0 || this.y > viewHeight) this.kill()
  }

  draw(ctx, atlas) {
    if (!atlas) return
    const s = this.sprite
    ctx.drawImage(
      atlas,
      s.x, s.y, s.w, s.h,
      Math.round(this.x), Math.round(this.y),
      this.w, this.h
    )
  }
}
