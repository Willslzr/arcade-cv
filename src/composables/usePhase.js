/**
 * usePhase.js — Máquina de estados de la experiencia.
 *
 * Por qué existe: antes `gameState` era un ref local dentro de
 * AvatarHeader. Eso obligaba a que cualquier otro componente que
 * necesitase saber la fase (HUD, overlay CRT, leaderboard) fuese
 * hijo suyo. Al sacarlo a un módulo con estado compartido, la
 * fase pasa a ser un servicio: cualquiera la lee, sólo las
 * transiciones declaradas aquí la escriben.
 *
 * Fases:
 *   idle   → CV navegable, canvas de estrellas al fondo
 *   glitch → corrupción del texto + cuenta atrás, sin scroll
 *   game   → partida activa a pantalla completa
 *   over   → partida terminada, entrada de iniciales y ranking
 */

import { ref, computed, readonly } from 'vue'

export const PHASE = Object.freeze({
  IDLE:   'idle',
  GLITCH: 'glitch',
  GAME:   'game',
  OVER:   'over',
})

/**
 * Transiciones legales. Cualquier otra se rechaza y se avisa.
 * OVER→GAME es el atajo de "jugar de nuevo" (tecla R): a diferencia
 * de IDLE→GLITCH, no repite la cinemática de corrupción — esa
 * historia sólo se cuenta la primera vez.
 */
const TRANSITIONS = {
  [PHASE.IDLE]:   [PHASE.GLITCH],
  [PHASE.GLITCH]: [PHASE.GAME, PHASE.IDLE],
  [PHASE.GAME]:   [PHASE.OVER, PHASE.IDLE],
  [PHASE.OVER]:   [PHASE.IDLE, PHASE.GLITCH, PHASE.GAME],
}

/** Estado a nivel de módulo: una sola instancia para toda la app. */
const phase = ref(PHASE.IDLE)
const countdown = ref(0)
const lastRun = ref(null) // { score, wave, durationMs }

let countdownTimer = null

/** Bloquea el scroll con una clase, no con estilo inline. */
function setScrollLock(locked) {
  document.body.classList.toggle('is-locked', locked)
}

function canGo(next) {
  return TRANSITIONS[phase.value]?.includes(next) ?? false
}

function go(next) {
  if (phase.value === next) return true
  if (!canGo(next)) {
    console.warn(`[usePhase] Transición inválida: ${phase.value} → ${next}`)
    return false
  }
  phase.value = next
  setScrollLock(next === PHASE.GLITCH || next === PHASE.GAME)
  return true
}

/**
 * Arranca la secuencia de intro.
 * @param {number} seconds  duración de la cuenta atrás
 * @param {() => void} [onComplete]  se ejecuta al llegar a 0
 */
function startSequence(seconds = 10, onComplete) {
  if (!go(PHASE.GLITCH)) return

  countdown.value = seconds
  clearInterval(countdownTimer)

  countdownTimer = setInterval(() => {
    countdown.value -= 1
    if (countdown.value <= 0) {
      clearInterval(countdownTimer)
      countdownTimer = null
      go(PHASE.GAME)
      onComplete?.()
    }
  }, 1000)
}

/** Aborta la intro y devuelve al CV (tecla Escape). */
function abort() {
  clearInterval(countdownTimer)
  countdownTimer = null
  countdown.value = 0
  go(PHASE.IDLE)
}

/** Fin de partida. `run` es el resumen que consume el leaderboard. */
function endRun(run) {
  lastRun.value = run ?? null
  go(PHASE.OVER)
}

/** Vuelta al CV desde la pantalla de puntuación. */
function reset() {
  lastRun.value = null
  go(PHASE.IDLE)
}

/** Jugar de nuevo desde la pantalla de resultados (tecla R). */
function restart() {
  if (phase.value !== PHASE.OVER) return
  lastRun.value = null
  go(PHASE.GAME)
}

export function usePhase() {
  return {
    phase: readonly(phase),
    countdown: readonly(countdown),
    lastRun: readonly(lastRun),

    isIdle:   computed(() => phase.value === PHASE.IDLE),
    isGlitch: computed(() => phase.value === PHASE.GLITCH),
    isGame:   computed(() => phase.value === PHASE.GAME),
    isOver:   computed(() => phase.value === PHASE.OVER),
    /** El CV se muestra en idle y glitch; el canvas manda a partir de game. */
    showsCv:  computed(() => phase.value === PHASE.IDLE || phase.value === PHASE.GLITCH),

    startSequence,
    abort,
    endRun,
    reset,
    restart,
  }
}
