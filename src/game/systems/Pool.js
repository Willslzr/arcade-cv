/**
 * Pool — reciclado genérico de entidades.
 *
 * Los proyectiles se crean en ráfagas durante la partida; si cada uno
 * fuera un `new`, el recolector de basura entra en juego justo cuando
 * más importan los 60 fps constantes. Aquí se reserva un bloque fijo
 * al arrancar y se recicla con `Entity.reset()`: nunca hay asignación
 * ni liberación de memoria durante la partida.
 *
 * Una entidad se considera "libre" cuando `alive === false`. No hace
 * falta un método `release`: `kill()` ya la devuelve al pool.
 */

export class Pool {
  /**
   * @param {() => object} factory   crea una instancia inerte (alive: false)
   * @param {number} size
   */
  constructor(factory, size) {
    this.items = Array.from({ length: size }, factory)
  }

  /** Ocupa la primera instancia libre y la reinicia; null si el pool está lleno. */
  acquire(props) {
    const free = this.items.find((item) => !item.alive)
    return free ? free.reset(props) : null
  }

  /** Itera sólo las instancias vivas, sin crear un array intermedio. */
  forEach(fn) {
    for (const item of this.items) {
      if (item.alive) fn(item)
    }
  }
}
