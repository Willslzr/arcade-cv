/**
 * useGlitch.js — Adaptador Vue sobre la clase GlitchEffect.
 *
 * La clase (src/lib/GlitchEffect.js) es JS puro y testeable: recibe
 * milisegundos y devuelve una cadena. Este composable se encarga
 * de lo que sí es de Vue: el ref, el reloj y la limpieza al
 * desmontar. Separarlos permite testear el algoritmo sin montar
 * un componente.
 */

import { ref, onUnmounted } from 'vue'
import { GlitchEffect } from '../lib/GlitchEffect.js'

const FRAME_MS = 50 // 20fps: el glitch se lee mejor "a saltos" que a 60

export function useGlitch() {
  const text = ref('')
  let timer = null
  let effect = null
  let startedAt = 0

  /**
   * @param {string} from  texto de origen
   * @param {string} to    texto de destino
   * @param {object} [opts] ver GlitchEffect
   */
  function run(from, to, opts) {
    stop()
    effect = new GlitchEffect(from, to, opts)
    startedAt = performance.now()
    text.value = effect.frameAt(0)

    timer = setInterval(() => {
      const elapsed = performance.now() - startedAt
      text.value = effect.frameAt(elapsed)
      // Cuando el efecto se ha resuelto del todo, dejamos de
      // repintar: no tiene sentido gastar timers en texto estático.
      if (effect.isSettled(elapsed)) stop()
    }, FRAME_MS)
  }

  function stop() {
    if (timer) clearInterval(timer)
    timer = null
  }

  /** Corta el efecto y fija el texto final de golpe. */
  function settle() {
    stop()
    if (effect) text.value = effect.finalText
  }

  onUnmounted(stop)

  return { text, run, stop, settle }
}
