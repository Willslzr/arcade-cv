/**
 * Entity — base común de todo lo que ocupa espacio en el juego.
 *
 * Existe por dos motivos concretos:
 *  · el sistema de colisiones necesita un contrato uniforme
 *    (x, y, w, h, alive) para no hacer comprobaciones de tipo;
 *  · el pooling necesita poder reciclar objetos, y para eso hace
 *    falta un `reset()` estándar.
 *
 * No hay herencia profunda: un solo nivel. Player, Enemy, Boss y
 * Projectile extienden esto y nada más.
 */

export class Entity {
  constructor({ x = 0, y = 0, w = 0, h = 0 } = {}) {
    this.x = x
    this.y = y
    this.w = w
    this.h = h
    this.vx = 0
    this.vy = 0
    this.alive = true
  }

  /** Caja de colisión. Se sobrescribe si el sprite tiene margen. */
  get bounds() {
    return { x: this.x, y: this.y, w: this.w, h: this.h }
  }

  get centerX() { return this.x + this.w / 2 }
  get centerY() { return this.y + this.h / 2 }

  /** Marca la entidad para que el sistema la retire del array. */
  kill() {
    this.alive = false
  }

  /** Devuelve el objeto a estado inicial para reutilizarlo del pool. */
  reset(props = {}) {
    Object.assign(this, { vx: 0, vy: 0, alive: true }, props)
    return this
  }

  update(/* delta */) {}
  draw(/* ctx, atlas */) {}
}
