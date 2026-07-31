/**
 * CollisionSystem — AABB puro.
 *
 * No importa Entity ni ningún tipo concreto: sólo espera objetos con
 * `.bounds` ({x, y, w, h}) y `.alive`. Así se puede probar y reutilizar
 * sin arrastrar el resto del motor, y en Fase 4 servirá igual para
 * proyectil-contra-enemigo que para nave-contra-enemigo.
 */

export class CollisionSystem {
  /** true si dos cajas {x, y, w, h} se solapan. */
  check(a, b) {
    return (
      a.x < b.x + b.w &&
      a.x + a.w > b.x &&
      a.y < b.y + b.h &&
      a.y + a.h > b.y
    )
  }

  /**
   * Compara cada vivo de groupA contra cada vivo de groupB y llama
   * `onHit(a, b)` por cada solape. Los grupos son arrays (por ejemplo
   * `Pool.items`); las instancias muertas se ignoran sin filtrarlas
   * antes, para no crear un array nuevo en cada fotograma.
   */
  resolve(groupA, groupB, onHit) {
    for (const a of groupA) {
      if (!a.alive) continue
      for (const b of groupB) {
        if (!b.alive) continue
        if (this.check(a.bounds, b.bounds)) onHit(a, b)
      }
    }
  }
}
