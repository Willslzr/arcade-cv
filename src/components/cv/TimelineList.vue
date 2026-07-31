<script setup>
/**
 * TimelineList — experiencia como línea temporal vertical.
 * El marcador es un nodo cuadrado sobre un raíl punteado: la
 * continuidad del raíl es lo que comunica "esto es una secuencia".
 */
defineProps({
  items: { type: Array, required: true },
})
</script>

<template>
  <ol class="tl">
    <li v-for="item in items" :key="item.id" class="tl__item">
      <div class="tl__marker" aria-hidden="true"></div>

      <p class="tl__dates">
        <time>{{ item.from }}</time>
        <span class="tl__arrow">→</span>
        <time>{{ item.to }}</time>
      </p>

      <h3 class="tl__role">{{ item.role }}</h3>
      <p class="tl__org">{{ item.org }}</p>
      <p class="tl__impact">{{ item.impact }}</p>

      <ul v-if="item.tags?.length" class="tl__tags">
        <li v-for="tag in item.tags" :key="tag" class="tl__tag">{{ tag }}</li>
      </ul>
    </li>
  </ol>
</template>

<style scoped>
.tl {
  position: relative;
  margin: 0;
  padding: 0 0 0 var(--s-6);
  list-style: none;
  display: grid;
  gap: var(--s-7);
}

/* Raíl punteado continuo detrás de todos los nodos */
.tl::before {
  content: '';
  position: absolute;
  inset-block: 6px 0;
  inset-inline-start: 5px;
  width: 1px;
  background: repeating-linear-gradient(
    to bottom,
    var(--c-line) 0 3px,
    transparent 3px 7px
  );
}

.tl__item {
  position: relative;
}

.tl__marker {
  position: absolute;
  inset-inline-start: calc(var(--s-6) * -1);
  inset-block-start: 6px;
  width: 11px;
  height: 11px;
  background: var(--c-void);
  border: 2px solid var(--c-phosphor);
  box-shadow: var(--glow-phosphor);
}

.tl__dates {
  display: flex;
  align-items: center;
  gap: var(--s-2);
  font-family: var(--f-display);
  font-size: var(--t-2xs);
  letter-spacing: var(--ls-wide);
  color: var(--c-amber);
  margin-bottom: var(--s-2);
}

.tl__arrow { color: var(--c-ink-faint); }

.tl__role {
  font-size: var(--t-lg);
  color: var(--c-ink);
}

.tl__org {
  margin-top: var(--s-1);
  font-size: var(--t-sm);
  color: var(--c-cyan);
}

.tl__impact {
  max-width: var(--w-prose);
  margin-top: var(--s-3);
  color: var(--c-ink-dim);
}

.tl__tags {
  display: flex;
  flex-wrap: wrap;
  gap: var(--s-2);
  margin: var(--s-4) 0 0;
  padding: 0;
  list-style: none;
}

.tl__tag {
  font-family: var(--f-display);
  font-size: var(--t-2xs);
  letter-spacing: var(--ls-wide);
  text-transform: uppercase;
  color: var(--c-ink-dim);
  padding: var(--s-1) var(--s-2);
  border: 1px solid var(--c-grid);
  background: var(--c-panel);
}
</style>
