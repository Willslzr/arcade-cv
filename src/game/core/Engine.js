/**
 * Engine — orquestador del bucle de juego.
 *
 * Responsabilidad única: gestionar el ciclo de vida (arrancar,
 * parar, redimensionar), llamar a update/draw en el orden correcto
 * y resolver QUIÉN choca con QUIÉN. No decide reglas de juego propias
 * de una entidad (cuánta vida pierde, qué patrón vuela): eso vive en
 * WaveManager, Enemy, Boss y CollisionSystem. Engine sólo conecta esas
 * piezas y decide qué pasa cuando se tocan.
 *
 * Cambios frente a la primera versión:
 *  · carga de assets por promesa (ver AssetLoader)
 *  · soporte de devicePixelRatio → sprites nítidos en pantallas HiDPI
 *  · redimensionado real: las entidades se enteran del nuevo tamaño
 *  · deltaTime acotado: al volver de una pestaña en segundo plano
 *    el primer delta podía valer varios segundos y teletransportaba
 *    todo fuera de la pantalla
 *  · combate cableado: oleadas, jefe, colisiones y explosiones
 *    (antes existían como sistemas aislados, probados en Node, pero
 *    nunca los llamaba nadie — por eso no aparecía nada en pantalla)
 */

import { InputHandler } from './InputHandler.js'
import { AssetLoader } from './AssetLoader.js'
import { Starfield } from '../render/Starfield.js'
import { Player } from '../entities/Player.js'
import { Projectile } from '../entities/Projectile.js'
import { Explosion } from '../entities/Explosion.js'
import { Boss } from '../entities/Boss.js'
import { Pool } from '../systems/Pool.js'
import { CollisionSystem } from '../systems/CollisionSystem.js'
import { WaveManager } from '../systems/WaveManager.js'
import { PLAYER, PROJECTILE, ENEMY, BOSS, EXPLOSION } from '../config/balance.js'

const MAX_DELTA = 1 / 20 // nunca simulamos saltos mayores a 50 ms

export class Engine {
  /**
   * @param {HTMLCanvasElement} canvas
   * @param {object} [hooks]
   * @param {(summary: object) => void} [hooks.onGameOver]
   * @param {(stats: {score: number, wave: number, lives: number}) => void} [hooks.onStatsChange]
   */
  constructor(canvas, hooks = {}) {
    this.canvas = canvas
    this.ctx = canvas.getContext('2d', { alpha: false })
    this.ctx.imageSmoothingEnabled = false

    this.hooks = hooks
    this.assets = new AssetLoader()
    this.input = new InputHandler()

    this.dpr = 1
    this.width = 0
    this.height = 0

    this.rafId = null
    this.lastTime = 0
    this.isRunning = false
    this.phase = 'idle'

    this.starfield = null
    this.player = null
    this.playerProjectiles = new Pool(() => new Projectile(), PROJECTILE.poolSize)
    this.enemyProjectiles = new Pool(() => new Projectile(), PROJECTILE.poolSize)
    this.explosions = new Pool(() => new Explosion(), EXPLOSION.poolSize)
    this.fireCooldown = 0

    // El jefe no vive en pool: sólo hay uno por partida y lo crea
    // WaveManager al avisar que las 4 oleadas están limpias.
    this.waveManager = new WaveManager({ onLevelClear: () => this.spawnBoss() })
    this.boss = null

    this.score = 0
    this.lives = PLAYER.lives
    this.invuln = 0
    this.runStartedAt = 0
    this.gameOverFired = false
    this.lastWaveNumber = 0

    this.collisions = new CollisionSystem()

    this.onResize = this.onResize.bind(this)
    this.loop = this.loop.bind(this)
  }

  /* ---------------------------------------------------------- */
  /* Ciclo de vida                                              */
  /* ---------------------------------------------------------- */

  async start() {
    await this.assets.loadImage('atlas', '/assets/atlas.png')

    this.resize()
    this.starfield = new Starfield(this.width, this.height)
    this.player = new Player(this.width, this.height)

    window.addEventListener('resize', this.onResize, { passive: true })

    this.isRunning = true
    this.lastTime = performance.now()
    this.rafId = requestAnimationFrame(this.loop)
  }

  stop() {
    this.isRunning = false
    if (this.rafId) cancelAnimationFrame(this.rafId)
    this.rafId = null
    window.removeEventListener('resize', this.onResize)
    this.input.destroy()
  }

  setPhase(phase) {
    this.phase = phase
    if (phase === 'game') {
      // Al entrar en juego el jugador reproduce su entrada cinemática
      // y el arma empieza sin cooldown pendiente de la partida anterior.
      this.player?.enter()
      this.fireCooldown = 0

      // Estado de la partida, siempre desde cero: permite rejugar
      // (tecla R) sin recargar la página y sin heredar nada de la
      // partida anterior.
      this.score = 0
      this.lives = PLAYER.lives
      this.invuln = 0
      this.gameOverFired = false
      this.runStartedAt = performance.now()
      this.boss = null
      this.waveManager.reset()
      this.waveManager.start()
      this.lastWaveNumber = this.waveManager.currentWaveNumber
      // Empieza limpio de verdad, sin fiarlo a que quien llame haya
      // pasado antes por `over` (que es quien limpia estos pools al
      // salir de `game`, más abajo): una partida nueva no hereda
      // proyectiles enemigos ni explosiones de la anterior.
      this.playerProjectiles?.forEach((p) => p.kill())
      this.enemyProjectiles?.forEach((p) => p.kill())
      this.explosions?.forEach((e) => e.kill())
      this.updateStats()
    } else {
      // Fuera de partida nada se actualiza ni se dibuja (ver update/
      // draw): sin esto, los pools quedarían "vivos" indefinidamente
      // y agotarían su capacidad la siguiente vez que se jugara.
      this.playerProjectiles?.forEach((p) => p.kill())
      this.enemyProjectiles?.forEach((p) => p.kill())
      this.explosions?.forEach((e) => e.kill())
      this.waveManager?.pool.forEach((e) => e.kill())
      this.boss = null
    }
  }

  /* ---------------------------------------------------------- */
  /* Dimensionado                                               */
  /* ---------------------------------------------------------- */

  onResize() {
    this.resize()
    this.starfield?.resize(this.width, this.height)
    this.player?.resize(this.width, this.height)
    this.boss?.resize(this.width, this.height)
  }

  /**
   * El canvas se dibuja siempre en coordenadas CSS; el escalado
   * HiDPI se resuelve con setTransform, así que la lógica de juego
   * no tiene que saber nada del ratio.
   */
  resize() {
    const rect = this.canvas.getBoundingClientRect()
    this.dpr = Math.min(window.devicePixelRatio || 1, 2)
    this.width = Math.max(1, Math.round(rect.width))
    this.height = Math.max(1, Math.round(rect.height))

    this.canvas.width = Math.round(this.width * this.dpr)
    this.canvas.height = Math.round(this.height * this.dpr)

    this.ctx.setTransform(this.dpr, 0, 0, this.dpr, 0, 0)
    this.ctx.imageSmoothingEnabled = false
  }

  /* ---------------------------------------------------------- */
  /* Bucle                                                      */
  /* ---------------------------------------------------------- */

  loop(timestamp) {
    if (!this.isRunning) return

    const delta = Math.min((timestamp - this.lastTime) / 1000, MAX_DELTA)
    this.lastTime = timestamp

    this.update(delta)
    this.draw()

    this.rafId = requestAnimationFrame(this.loop)
  }

  update(delta) {
    // El campo de estrellas corre en todas las fases: es el hilo
    // visual que hace que la transición CV → juego no tenga corte.
    this.starfield.update(delta, this.phase)

    if (this.phase !== 'game') return

    this.player.update(delta, this.input, this.width, this.height)
    this.updateWeapons(delta)
    this.playerProjectiles.forEach((p) => p.update(delta, this.height))

    this.invuln = Math.max(0, this.invuln - delta)

    const view = { width: this.width, height: this.height }
    this.waveManager.update(delta, view)

    // WaveManager no avisa "ha cambiado la ola" con el número ya
    // actualizado (su hook dispara antes de avanzar el índice), así
    // que se detecta comparando: barato, y sólo toca el HUD cuando
    // de verdad cambia, no en cada fotograma.
    if (this.waveManager.currentWaveNumber !== this.lastWaveNumber) {
      this.lastWaveNumber = this.waveManager.currentWaveNumber
      this.updateStats()
    }

    this.updateEnemyFire(delta)
    this.enemyProjectiles.forEach((p) => p.update(delta, this.height))

    this.boss?.update(delta)
    this.explosions.forEach((e) => e.update(delta))

    this.resolveCombat()
  }

  /** Dispara con cooldown mientras se mantiene pulsado; sin ráfaga automática sin límite. */
  updateWeapons(delta) {
    this.fireCooldown = Math.max(0, this.fireCooldown - delta)
    if (!this.input.fire || this.fireCooldown > 0) return

    const shot = this.playerProjectiles.acquire({ faction: 'player' })
    if (shot) {
      shot.x = this.player.centerX - shot.w / 2
      shot.y = this.player.y - shot.h
    }
    this.fireCooldown = PLAYER.fireCooldownMs / 1000
  }

  /**
   * Disparo enemigo: una tirada por enemigo vivo y otra para el jefe,
   * con la probabilidad por segundo de balance.js. A framerate
   * variable, `Math.random() < chance * delta` converge a la misma
   * frecuencia media que a framerate fijo.
   */
  updateEnemyFire(delta) {
    for (const enemy of this.waveManager.pool.items) {
      if (!enemy.alive) continue
      if (Math.random() >= ENEMY.fireChancePerSecond * delta) continue
      const shot = this.enemyProjectiles.acquire({ faction: 'enemy' })
      if (shot) {
        shot.x = enemy.centerX - shot.w / 2
        shot.y = enemy.y + enemy.h
      }
    }

    if (this.boss && Math.random() < BOSS.fireChancePerSecond * delta) {
      const shot = this.enemyProjectiles.acquire({ faction: 'enemy' })
      if (shot) {
        shot.x = this.boss.centerX - shot.w / 2
        shot.y = this.boss.y + this.boss.h
      }
    }
  }

  /** Las 4 oleadas están limpias: entra el jefe único de la partida. */
  spawnBoss() {
    this.boss = new Boss(this.width, this.height)
    this.boss.enter()
  }

  spawnExplosion(x, y) {
    this.explosions.acquire({ x, y })
  }

  addScore(points) {
    this.score += points
    this.updateStats()
  }

  updateStats() {
    this.hooks.onStatsChange?.({
      score: this.score,
      wave: this.waveManager.currentWaveNumber,
      lives: Math.max(0, this.lives),
    })
  }

  /**
   * Quién choca con quién. El orden importa: los disparos del
   * jugador resuelven primero (para que un enemigo que muere este
   * fotograma no pueda además chocar con la nave), y la nave sólo
   * puede recibir un golpe por fotograma sin importar con cuántas
   * cosas se solape a la vez.
   */
  resolveCombat() {
    this.collisions.resolve(this.playerProjectiles.items, this.waveManager.pool.items, (shot, enemy) => {
      shot.kill()
      if (enemy.takeHit(1)) {
        this.spawnExplosion(enemy.centerX, enemy.centerY)
        this.addScore(enemy.score)
      }
    })

    if (this.boss) {
      this.collisions.resolve(this.playerProjectiles.items, [this.boss], (shot, boss) => {
        shot.kill()
        if (boss.takeHit(1)) {
          this.spawnExplosion(boss.centerX, boss.centerY)
          this.addScore(BOSS.score)
          this.boss = null
          // Sin esto la partida no terminaba nunca: WaveManager ya
          // está `cleared` (no quedan más oleadas) y sin jefe no hay
          // nada más que pueda matar al jugador, así que quedaba
          // volando en un nivel vacío para siempre.
          this.completeRun(true)
        }
      })
    }

    if (this.invuln > 0) return

    let hitPlayer = false
    this.collisions.resolve([this.player], this.waveManager.pool.items, (_player, enemy) => {
      enemy.kill()
      this.spawnExplosion(enemy.centerX, enemy.centerY)
      hitPlayer = true
    })
    this.collisions.resolve([this.player], this.enemyProjectiles.items, (_player, shot) => {
      shot.kill()
      hitPlayer = true
    })
    if (this.boss) {
      this.collisions.resolve([this.player], [this.boss], () => { hitPlayer = true })
    }

    if (hitPlayer) this.damagePlayer()
  }

  damagePlayer() {
    this.lives -= 1
    this.invuln = PLAYER.invulnMs / 1000
    this.spawnExplosion(this.player.centerX, this.player.centerY)
    this.updateStats()

    if (this.lives <= 0) this.completeRun(false)
  }

  /**
   * Único punto de salida de una partida, gane o pierda quien juega.
   * `gameOverFired` evita que dos causas de fin de partida en el
   * mismo fotograma (por ejemplo, morir justo al matar al jefe)
   * disparen `onGameOver` dos veces.
   */
  completeRun(victory) {
    if (this.gameOverFired) return
    this.gameOverFired = true
    this.hooks.onGameOver?.({
      score: this.score,
      wave: this.waveManager.currentWaveNumber,
      durationMs: Math.round(performance.now() - this.runStartedAt),
      victory,
    })
  }

  draw() {
    const { ctx } = this
    ctx.fillStyle = '#04060a'
    ctx.fillRect(0, 0, this.width, this.height)

    this.starfield.draw(ctx)

    if (this.phase !== 'game') return

    const atlas = this.assets.get('atlas')

    this.waveManager.pool.forEach((e) => e.draw(ctx, atlas))
    this.boss?.draw(ctx, atlas)
    this.enemyProjectiles.forEach((p) => p.draw(ctx, atlas))
    this.playerProjectiles.forEach((p) => p.draw(ctx, atlas))

    // Parpadeo mientras dura la invulnerabilidad tras un golpe: sin
    // esta señal, perder una vida es invisible para quien juega.
    const blinking = this.invuln > 0 && Math.floor(this.invuln * 10) % 2 === 0
    ctx.globalAlpha = blinking ? 0.35 : 1
    this.player.draw(ctx, atlas)
    ctx.globalAlpha = 1

    this.explosions.forEach((e) => e.draw(ctx, atlas))
  }
}
