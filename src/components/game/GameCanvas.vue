<script setup>
/**
 * GameCanvas — puente entre Vue y el motor.
 *
 * Deliberadamente delgado: crea el motor, le pasa la fase y lo
 * destruye. Toda la lógica de render vive en src/game. Si mañana
 * cambiásemos Vue por otra cosa, este es el único fichero del
 * juego que habría que reescribir.
 */
import { ref, onMounted, onBeforeUnmount, watch } from 'vue'
import { Engine } from '../../game/core/Engine.js'

const props = defineProps({
  phase: { type: String, required: true },
})

const emit = defineEmits(['ready', 'gameover', 'stats'])

const canvasRef = ref(null)
let engine = null

onMounted(async () => {
  if (!canvasRef.value) return
  engine = new Engine(canvasRef.value, {
    onGameOver: (summary) => emit('gameover', summary),
    onStatsChange: (stats) => emit('stats', stats),
  })

  try {
    await engine.start()
    engine.setPhase(props.phase)
    emit('ready')
  } catch (err) {
    // Si el atlas no carga, el CV sigue siendo perfectamente
    // usable: sólo pierde el fondo animado.
    console.error('[GameCanvas] No se pudo iniciar el motor:', err)
  }
})

watch(() => props.phase, (next) => {
  if (!engine) return
  engine.setPhase(next)
  engine.input.setCapturing(next === 'game')
})

onBeforeUnmount(() => {
  engine?.stop()
  engine = null
})
</script>

<template>
  <canvas
    ref="canvasRef"
    class="stage-canvas pixelated"
    aria-hidden="true"
  ></canvas>
</template>

<style scoped>
/* Fijo a la ventana, siempre al fondo. Nunca cambia de tamaño de
   caja al cambiar de fase, así que no hay reflow ni salto. */
.stage-canvas {
  position: fixed;
  inset: 0;
  width: 100%;
  height: 100%;
  z-index: var(--z-canvas);
  pointer-events: none;
}
</style>
