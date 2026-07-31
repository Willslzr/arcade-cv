<script setup>
/**
 * StageSection — envoltorio de sección del CV.
 *
 * El CV está dividido en "stages" porque el sitio es un arcade y
 * porque el orden importa de verdad: stack → experiencia →
 * proyectos → contacto es la secuencia en la que un reclutador
 * decide. La numeración codifica esa secuencia real, no rellena.
 */
const props = defineProps({
  // El id lo decide App.vue, no el índice: así renumerar secciones
  // no rompe los enlaces que alguien haya compartido.
  id:    { type: String, required: true },
  index: { type: Number, required: true },
  title: { type: String, required: true },
  hint:  { type: String, default: '' },
})

const headingId = `${props.id}-title`
</script>

<template>
  <section class="stage" :id="id" :aria-labelledby="headingId">
    <div class="stage__head">
      <p class="stage__eyebrow">
        <span class="stage__num">{{ String(index).padStart(2, '0') }}</span>
        <span class="stage__rule" aria-hidden="true"></span>
      </p>
      <h2 :id="headingId" class="stage__title">{{ title }}</h2>
      <p v-if="hint" class="stage__hint">{{ hint }}</p>
    </div>

    <div class="stage__body">
      <slot />
    </div>
  </section>
</template>

<style scoped>
.stage {
  padding-block: var(--s-8);
  border-top: 1px solid var(--c-line);
}

.stage__head {
  margin-bottom: var(--s-6);
}

.stage__eyebrow {
  display: flex;
  align-items: center;
  gap: var(--s-3);
  margin-bottom: var(--s-3);
}

.stage__num {
  font-family: var(--f-display);
  font-size: var(--t-2xs);
  letter-spacing: var(--ls-xwide);
  color: var(--c-amber);
  padding: var(--s-1) var(--s-2);
  border: 1px solid var(--c-amber);
}

.stage__rule {
  flex: 1;
  height: 1px;
  background: repeating-linear-gradient(
    to right,
    var(--c-line) 0 4px,
    transparent 4px 8px
  );
}

.stage__title {
  font-size: var(--t-xl);
  color: var(--c-ink);
}

.stage__hint {
  max-width: var(--w-prose);
  margin-top: var(--s-3);
  color: var(--c-ink-dim);
  font-size: var(--t-sm);
}

@media (max-width: 48rem) {
  .stage { padding-block: var(--s-7); }
}
</style>
