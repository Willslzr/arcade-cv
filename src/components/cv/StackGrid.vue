<script setup>
/**
 * StackGrid — el stack como barras de EXP.
 *
 * Una lista de logos no dice nada; una barra sí, siempre que vaya
 * acompañada de la nota que explica en qué se ha usado. El valor
 * numérico se expone también en texto para lectores de pantalla.
 */
defineProps({
  items: { type: Array, required: true },
})
</script>

<template>
  <ul class="stack">
    <li v-for="item in items" :key="item.id" class="stack__row">
      <div class="stack__meta">
        <h3 class="stack__name">{{ item.label }}</h3>
        <span class="stack__value">{{ item.level }}<i>/100</i></span>
      </div>

      <div
        class="stack__bar"
        role="meter"
        :aria-valuenow="item.level"
        aria-valuemin="0"
        aria-valuemax="100"
        :aria-label="`${item.label}: nivel ${item.level} de 100`"
      >
        <span class="stack__fill" :style="{ '--lvl': `${item.level}%` }"></span>
      </div>

      <p class="stack__note">{{ item.note }}</p>
    </li>
  </ul>
</template>

<style scoped>
.stack {
  display: grid;
  gap: var(--s-5);
  padding: 0;
  margin: 0;
  list-style: none;
}

.stack__row {
  display: grid;
  gap: var(--s-2);
}

.stack__meta {
  display: flex;
  align-items: baseline;
  justify-content: space-between;
  gap: var(--s-3);
}

.stack__name {
  font-size: var(--t-md);
  color: var(--c-phosphor);
  letter-spacing: var(--ls-wide);
}

.stack__value {
  font-family: var(--f-numeric);
  font-size: 1.25rem;
  color: var(--c-amber);
  font-variant-numeric: tabular-nums;
}

.stack__value i {
  font-style: normal;
  color: var(--c-ink-faint);
  font-size: 1rem;
}

/* La barra se dibuja en bloques de 4px con hueco: se lee como
   una barra de energía de 8 bits, no como un progress bar web. */
.stack__bar {
  height: 14px;
  padding: 2px;
  border: 1px solid var(--c-line);
  background: var(--c-panel);
}

.stack__fill {
  display: block;
  height: 100%;
  width: var(--lvl);
  background-image: repeating-linear-gradient(
    to right,
    var(--c-phosphor) 0 6px,
    transparent 6px 8px
  );
  box-shadow: var(--glow-phosphor);
  animation: stack-load var(--d-slow) var(--ease-crt) both;
}

@keyframes stack-load {
  from { width: 0; }
  to   { width: var(--lvl); }
}

.stack__note {
  font-size: var(--t-sm);
  color: var(--c-ink-dim);
}

@media (min-width: 48rem) {
  .stack {
    grid-template-columns: repeat(2, minmax(0, 1fr));
    gap: var(--s-6) var(--s-7);
  }
}
</style>
