/**
 * WaveManager — lee waves.js y decide qué enemigo aparece y cuándo.
 *
 * Ajustar el nivel es editar `config/waves.js`; este fichero no conoce
 * los números de la coreografía, sólo sabe ejecutarla. Una ola no
 * avanza a la siguiente hasta que se ha "asentado": ya salieron todos
 * sus spawns y ningún enemigo de esa ola sigue vivo. El jefe queda
 * fuera de esta clase a propósito — `onLevelClear` es la señal para
 * que otra cosa (fuera de esta fase) decida instanciar Boss.
 */

import { Enemy, PATHS } from '../entities/Enemy.js'
import { Pool } from './Pool.js'
import { WAVES } from '../config/waves.js'
import { ENEMY } from '../config/balance.js'

/** Origen por defecto de cada patrón, como fracción de la vista. */
const DEFAULT_ORIGIN = {
  sweepLeftToRight: { xFrac: 0, yFrac: 0.18 },
  sweepRightToLeft: { xFrac: 1, yFrac: 0.3 },
  diagonalFromLeft: { xFrac: 0, yFrac: 0.08 },
  diagonalFromRight: { xFrac: 1, yFrac: 0.08 },
  sineDive: { xFrac: 0.5, yFrac: 0 },
  loopDrop: { xFrac: 0.5, yFrac: 0 },
}

/**
 * Cada formación es una función que devuelve posiciones relativas
 * {dx, dy, delayS} para un grupo que comparte tipo y patrón. El
 * patrón mueve al grupo una vez en pantalla; la formación sólo decide
 * cómo entran (en fila, en cuña, en cola...).
 */
export const FORMATIONS = {
  line5: () => spread(5, ENEMY.formationSpacing),
  v5: () => vShape(5, ENEMY.formationSpacing),
  column4: () => stack(4, ENEMY.formationSpacing, ENEMY.formationStaggerMs / 1000),
  stagger6: () => conga(6, ENEMY.formationStaggerMs / 1000),
}

function spread(count, spacing) {
  const offset = (count - 1) / 2
  return Array.from({ length: count }, (_, i) => ({ dx: (i - offset) * spacing, dy: 0, delayS: 0 }))
}

function vShape(count, spacing) {
  const offset = (count - 1) / 2
  return Array.from({ length: count }, (_, i) => ({
    dx: (i - offset) * spacing,
    dy: Math.abs(i - offset) * spacing * 0.6,
    delayS: 0,
  }))
}

function stack(count, spacing, stagger) {
  return Array.from({ length: count }, (_, i) => ({ dx: 0, dy: -i * spacing, delayS: i * stagger }))
}

function conga(count, stagger) {
  return Array.from({ length: count }, (_, i) => ({ dx: 0, dy: 0, delayS: i * stagger }))
}

export class WaveManager {
  /**
   * @param {object} [hooks]
   * @param {(index: number, wave: object) => void} [hooks.onWaveClear]
   * @param {() => void} [hooks.onLevelClear]
   */
  constructor(hooks = {}) {
    this.hooks = hooks
    this.pool = new Pool(() => new Enemy(), ENEMY.poolSize)
    this.reset()
  }

  /** Vuelve al estado previo a start(): pensado para poder rejugar sin recargar. */
  reset() {
    this.pool.forEach((enemy) => enemy.kill())
    this.waveIndex = -1
    this.waveClock = 0
    this.pendingSpawns = []
    this.deferredSpawns = []
    this.spawnedAny = false
    this.running = false
    this.cleared = false
  }

  start() {
    this.waveIndex = 0
    this.waveClock = 0
    this.pendingSpawns = [...WAVES[0].spawns]
    this.deferredSpawns = []
    this.spawnedAny = false
    this.running = true
    this.cleared = false
  }

  /** 1-based, para mostrar "Ola 2 de 4" sin que la UI sepa de índices. */
  get currentWaveNumber() {
    return this.waveIndex + 1
  }

  get totalWaves() {
    return WAVES.length
  }

  update(delta, view) {
    if (!this.running) return
    this.waveClock += delta

    while (this.pendingSpawns.length && this.pendingSpawns[0].at <= this.waveClock) {
      this.enqueue(this.pendingSpawns.shift(), view)
    }

    this.deferredSpawns = this.deferredSpawns.filter((deferred) => {
      deferred.timeLeft -= delta
      if (deferred.timeLeft > 0) return true
      this.pool.acquire(deferred.props)
      return false
    })

    this.pool.forEach((enemy) => enemy.update(delta))

    const settled = this.spawnedAny && this.pendingSpawns.length === 0 && this.deferredSpawns.length === 0
    if (!settled) return
    if (this.pool.items.some((enemy) => enemy.alive)) return

    const wave = WAVES[this.waveIndex]
    this.hooks.onWaveClear?.(this.waveIndex, wave)
    this.advance()
  }

  enqueue(spawnDef, view) {
    const layout = FORMATIONS[spawnDef.formation]
    const origin = DEFAULT_ORIGIN[spawnDef.path]
    const movement = PATHS[spawnDef.path]

    if (!layout || !origin || !movement) {
      console.warn('WaveManager: spawn con formación o patrón desconocidos', spawnDef)
      return
    }

    this.spawnedAny = true
    const baseX = origin.xFrac * view.width
    const baseY = origin.yFrac * view.height
    const duration = spawnDef.durationS ?? ENEMY.defaultPathDurationS

    for (const slot of layout()) {
      this.deferredSpawns.push({
        timeLeft: slot.delayS,
        props: {
          x: baseX + slot.dx,
          y: baseY + slot.dy,
          type: spawnDef.enemyType,
          movement,
          duration,
          travelW: view.width,
          travelH: view.height,
        },
      })
    }
  }

  advance() {
    this.waveIndex += 1
    if (this.waveIndex >= WAVES.length) {
      this.running = false
      this.cleared = true
      this.hooks.onLevelClear?.()
      return
    }
    this.waveClock = 0
    this.pendingSpawns = [...WAVES[this.waveIndex].spawns]
    this.deferredSpawns = []
    this.spawnedAny = false
  }
}
