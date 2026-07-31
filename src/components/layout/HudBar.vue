<script setup>
/**
 * HudBar — el elemento firma del sitio.
 *
 * Marcador de máquina recreativa fijo en la parte superior. No es
 * adorno: SCORE es el porcentaje del CV que has leído convertido a
 * puntos, y HI-SCORE es la mejor marca real del ranking. Es decir,
 * el HUD dice la verdad sobre dos cosas distintas — tu avance
 * leyendo y el récord jugando — con el mismo lenguaje visual.
 *
 * En fase de juego cambia de contenido: pasa a mostrar vidas,
 * oleada y puntuación de la partida.
 */
import { computed } from 'vue'

const props = defineProps({
  phase:     { type: String, required: true },
  score:     { type: Number, default: 0 },
  hiScore:   { type: Number, default: 0 },
  progress:  { type: Number, default: 0 }, // 0..1
  lives:     { type: Number, default: 1 },
  wave:      { type: Number, default: 0 },
})

const inGame = computed(() => props.phase === 'game' || props.phase === 'over')

/** Formato arcade: siempre 6 dígitos con ceros a la izquierda. */
const pad = (n) => String(Math.max(0, Math.floor(n))).padStart(6, '0')
</script>

<template>
  <header class="hud" :data-phase="phase">
    <div class="hud__inner u-shell">

      <!-- Izquierda: identidad del jugador -->
      <div class="hud__cell">
        <span class="hud__key">1UP</span>
        <span class="hud__val hud__val--phosphor">{{ pad(score) }}</span>
      </div>

      <!-- Centro: contexto según la fase -->
      <div class="hud__cell hud__cell--center">
        <template v-if="inGame">
          <span class="hud__key">Oleada</span>
          <span class="hud__val hud__val--amber">{{ String(wave).padStart(2, '0') }}</span>
        </template>
        <template v-else>
          <span class="hud__key hud__key--wide">Leído</span>
          <span class="hud__val hud__val--amber">{{ Math.round(progress * 100) }}%</span>
        </template>
      </div>

      <!-- Derecha: récord o vidas -->
      <div class="hud__cell hud__cell--end">
        <template v-if="inGame">
          <span class="hud__key">Vidas</span>
          <span class="hud__lives">
            <i v-for="n in Math.max(0, lives)" :key="n" class="hud__life"></i>
            <em v-if="lives <= 0" class="hud__val hud__val--magenta">—</em>
          </span>
        </template>
        <template v-else>
          <span class="hud__key">Hi-Score</span>
          <span class="hud__val hud__val--magenta">{{ pad(hiScore) }}</span>
        </template>
      </div>

    </div>

    <!-- Barra de avance: el mismo dato que SCORE, en forma física -->
    <div class="hud__rail">
      <div class="hud__fill" :style="{ transform: `scaleX(${inGame ? 1 : progress})` }"></div>
    </div>
  </header>
</template>

<style scoped>
.hud {
  position: fixed;
  inset-block-start: 0;
  inset-inline: 0;
  z-index: var(--z-hud);
  background: linear-gradient(to bottom, var(--c-void) 60%, rgba(4, 6, 10, 0.86));
  border-bottom: 1px solid var(--c-line);
  backdrop-filter: blur(6px);
}

.hud__inner {
  display: grid;
  grid-template-columns: 1fr auto 1fr;
  align-items: center;
  gap: var(--s-4);
  height: var(--hud-h);
}

.hud__cell {
  display: flex;
  align-items: baseline;
  gap: var(--s-2);
  min-width: 0;
}

.hud__cell--center { justify-content: center; }
.hud__cell--end    { justify-content: flex-end; }

.hud__key {
  font-family: var(--f-display);
  font-size: var(--t-2xs);
  letter-spacing: var(--ls-wide);
  text-transform: uppercase;
  color: var(--c-ink-faint);
  white-space: nowrap;
}

.hud__val {
  font-family: var(--f-numeric);
  font-size: 1.375rem;
  line-height: 1;
  letter-spacing: 0.04em;
  font-variant-numeric: tabular-nums;
}

.hud__val--phosphor { color: var(--c-phosphor); text-shadow: var(--glow-phosphor); }
.hud__val--amber    { color: var(--c-amber); }
.hud__val--magenta  { color: var(--c-magenta); }

/* Vidas dibujadas como naves: cuadrado con muesca, no un corazón */
.hud__lives {
  display: inline-flex;
  gap: var(--s-1);
  align-items: center;
}

.hud__life {
  width: 10px;
  height: 10px;
  background: var(--c-phosphor);
  clip-path: polygon(50% 0, 100% 100%, 50% 76%, 0 100%);
}

/* Riel de avance de lectura */
.hud__rail {
  height: 2px;
  background: var(--c-grid);
  overflow: hidden;
}

.hud__fill {
  height: 100%;
  background: var(--c-phosphor);
  transform-origin: left;
  transition: transform 120ms linear;
  box-shadow: var(--glow-phosphor);
}

/* En pantallas estrechas el HUD se queda en dos datos: el que
   identifica y el que motiva. Ocultar es mejor que apretar. */
@media (max-width: 34rem) {
  .hud__inner { grid-template-columns: 1fr auto; }
  .hud__cell--center { display: none; }
}
</style>
