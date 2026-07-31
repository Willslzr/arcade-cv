/**
 * Engine — orquestador del bucle de juego.
 *
 * Responsabilidad única: gestionar el ciclo de vida (arrancar,
 * parar, redimensionar) y llamar a update/draw en el orden
 * correcto. No conoce reglas de juego: eso vivirá en los sistemas.
 *
 * Cambios frente a la primera versión:
 *  · carga de assets por promesa (ver AssetLoader)
 *  · soporte de devicePixelRatio → sprites nítidos en pantallas HiDPI
 *  · redimensionado real: las entidades se enteran del nuevo tamaño
 *  · deltaTime acotado: al volver de una pestaña en segundo plano
 *    el primer delta podía valer varios segundos y teletransportaba
 *    todo fuera de la pantalla
 */

import { InputHandler } from './InputHandler.js'
import { AssetLoader } from './AssetLoader.js'
import { Starfield } from '../render/Starfield.js'
import { Player } from '../entities/Player.js'
import { Projectile } from '../entities/Projectile.js'
import { Pool } from '../systems/Pool.js'
import { CollisionSystem } from '../systems/CollisionSystem.js'
import { PLAYER, PROJECTILE } from '../config/balance.js'

const MAX_DELTA = 1 / 20 // nunca simulamos saltos mayores a 50 ms

export class Engine {
  /**
   * @param {HTMLCanvasElement} canvas
   * @param {object} [hooks]
   * @param {(summary: object) => void} [hooks.onGameOver]
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
    this.fireCooldown = 0

    // Genérico y listo para Fase 4 (proyectil vs enemigo, nave vs
    // enemigo); hasta que exista Enemy.js no hay segundo grupo con
    // el que llamar a resolve().
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
    } else {
      // Fuera de partida los proyectiles no se actualizan: sin esto
      // seguirían "vivos" indefinidamente y agotarían el pool la
      // siguiente vez que se jugara.
      this.playerProjectiles?.forEach((p) => p.kill())
    }
  }

  /* ---------------------------------------------------------- */
  /* Dimensionado                                               */
  /* ---------------------------------------------------------- */

  onResize() {
    this.resize()
    this.starfield?.resize(this.width, this.height)
    this.player?.resize(this.width, this.height)
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

    if (this.phase === 'game') {
      this.player.update(delta, this.input, this.width, this.height)
      this.updateWeapons(delta)
      this.playerProjectiles.forEach((p) => p.update(delta, this.height))
    }
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

  draw() {
    const { ctx } = this
    ctx.fillStyle = '#04060a'
    ctx.fillRect(0, 0, this.width, this.height)

    this.starfield.draw(ctx)

    if (this.phase === 'game') {
      const atlas = this.assets.get('atlas')
      this.player.draw(ctx, atlas)
      this.playerProjectiles.forEach((p) => p.draw(ctx, atlas))
    }
  }
}
