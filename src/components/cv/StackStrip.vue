<script setup>
/**
 * StackStrip — la tira de tecnologías, justo bajo la portada.
 *
 * Es lo primero que un reclutador busca y suele estar enterrado a
 * mitad de página. Aquí va sobre el pliegue, en una sola línea
 * horizontal que se lee de un vistazo.
 *
 * La primera ficha (`lead: true`) se destaca: no todas las
 * tecnologías de una lista pesan lo mismo, y fingir que sí obliga
 * al lector a adivinar. El orden ya es la señal; el destacado la
 * hace explícita.
 */
defineProps({
  items: { type: Array, required: true },
})
</script>

<template>
  <section class="strip" aria-labelledby="strip-title">
    <h2 id="strip-title" class="strip__title">
      <span class="strip__pip" aria-hidden="true"></span>
      Stack principal
    </h2>

    <ul class="strip__list">
      <li
        v-for="item in items"
        :key="item.id"
        class="strip__chip"
        :class="{ 'is-lead': item.lead }"
      >
        <span class="strip__label">{{ item.label }}</span>
        <span class="strip__kind">{{ item.kind }}</span>
        <span v-if="item.lead" class="strip__badge">Principal</span>
      </li>
    </ul>
  </section>
</template>

<style scoped>
.strip {
  padding-block: var(--s-5) var(--s-6);
  border-block: 1px solid var(--c-line);
}

.strip__title {
  display: flex;
  align-items: center;
  gap: var(--s-2);
  font-size: var(--t-2xs);
  letter-spacing: var(--ls-xwide);
  color: var(--c-ink-faint);
  margin-bottom: var(--s-4);
}

.strip__pip {
  width: 6px;
  height: 6px;
  background: var(--c-phosphor);
  box-shadow: var(--glow-phosphor);
}

.strip__list {
  display: flex;
  flex-wrap: wrap;
  gap: var(--s-2);
  margin: 0;
  padding: 0;
  list-style: none;
}

/* Cada ficha es una celda de datos, no una pastilla decorativa:
   nombre arriba, categoría debajo. El reclutador ve a la vez
   qué sabes y de qué tipo es. */
.strip__chip {
  position: relative;
  display: grid;
  gap: 2px;
  padding: var(--s-3) var(--s-4);
  background: var(--c-panel);
  border: 1px solid var(--c-grid);
  transition: border-color var(--d-fast) var(--ease-crt),
              transform var(--d-fast) var(--ease-crt);
}

.strip__chip:hover {
  border-color: var(--c-phosphor-lo);
  transform: translateY(-2px);
}

.strip__label {
  font-family: var(--f-display);
  font-size: var(--t-xs);
  letter-spacing: var(--ls-wide);
  text-transform: uppercase;
  color: var(--c-ink);
}

.strip__kind {
  font-size: var(--t-2xs);
  color: var(--c-ink-faint);
}

/* La tecnología principal: borde en fósforo y etiqueta explícita. */
.is-lead {
  border-color: var(--c-phosphor);
  background: var(--c-panel-hi);
  box-shadow: var(--shadow-hard);
}

.is-lead .strip__label {
  color: var(--c-phosphor);
}

.strip__badge {
  position: absolute;
  inset-block-start: -8px;
  inset-inline-start: var(--s-3);
  padding: 1px var(--s-2);
  font-family: var(--f-display);
  font-size: 9px;
  letter-spacing: var(--ls-wide);
  text-transform: uppercase;
  color: var(--c-void);
  background: var(--c-phosphor);
}

@media (max-width: 30rem) {
  .strip__list { display: grid; grid-template-columns: repeat(2, minmax(0, 1fr)); }
}
</style>
