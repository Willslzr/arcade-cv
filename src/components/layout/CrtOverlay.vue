<script setup>
/**
 * CrtOverlay — la capa de vidrio del monitor.
 * Puramente presentacional y sin eventos (pointer-events: none).
 * Recibe la fase para bajar la intensidad durante la partida.
 */
defineProps({
  phase: { type: String, default: 'idle' },
})
</script>

<template>
  <div class="crt" :data-phase="phase" aria-hidden="true">
    <div class="crt__grille"></div>
    <div class="crt__vignette"></div>
    <div class="crt__sweep"></div>
  </div>
</template>
