/**
 * useReadProgress.js — Progreso de lectura del CV.
 *
 * Alimenta el marcador SCORE del HUD. La elección no es decorativa:
 * en un CV lo único que "puntúa" antes de jugar es cuánto has leído,
 * así que el número del HUD mide exactamente eso. Se expresa en
 * puntos (0 → 25.000) para que se lea como una máquina recreativa.
 *
 * Usa rAF con throttle: el listener de scroll no toca el layout.
 */

import { ref, onMounted, onUnmounted } from 'vue'

const MAX_SCORE = 25000

export function useReadProgress() {
  const ratio = ref(0)  // 0..1
  const score = ref(0)  // 0..MAX_SCORE
  let ticking = false

  function measure() {
    const doc = document.documentElement
    const scrollable = doc.scrollHeight - window.innerHeight
    const next = scrollable > 0 ? Math.min(1, window.scrollY / scrollable) : 0
    ratio.value = next
    // Redondeo a decenas: los marcadores arcade no cuentan de uno en uno.
    score.value = Math.round((next * MAX_SCORE) / 10) * 10
    ticking = false
  }

  function onScroll() {
    if (ticking) return
    ticking = true
    requestAnimationFrame(measure)
  }

  onMounted(() => {
    measure()
    window.addEventListener('scroll', onScroll, { passive: true })
    window.addEventListener('resize', onScroll, { passive: true })
  })

  onUnmounted(() => {
    window.removeEventListener('scroll', onScroll)
    window.removeEventListener('resize', onScroll)
  })

  return { ratio, score, MAX_SCORE }
}
