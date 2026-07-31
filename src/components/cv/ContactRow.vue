<script setup>
/**
 * ContactRow — contacto como tabla de datos.
 * Sin formulario: para un CV, un email visible convierte mejor que
 * un input, y elimina la necesidad de backend para este bloque.
 */
defineProps({
  items: { type: Array, required: true },
  cv:    { type: String, default: '' },
})
</script>

<template>
  <div class="contact">
    <ul class="contact__list">
      <li v-for="item in items" :key="item.id" class="contact__row">
        <span class="u-label contact__key">{{ item.label }}</span>
        <a :href="item.href" class="contact__value" rel="noopener">{{ item.value }}</a>
      </li>
    </ul>

    <a v-if="cv" :href="cv" class="contact__cta" download>
      Descargar CV
      <span class="contact__cta-icon" aria-hidden="true">▼</span>
    </a>
  </div>
</template>

<style scoped>
.contact {
  display: grid;
  gap: var(--s-6);
  align-items: start;
}

.contact__list {
  margin: 0;
  padding: 0;
  list-style: none;
  border-top: 1px solid var(--c-line);
}

.contact__row {
  display: grid;
  grid-template-columns: 7rem 1fr;
  align-items: baseline;
  gap: var(--s-4);
  padding-block: var(--s-3);
  border-bottom: 1px solid var(--c-line);
}

.contact__key { padding-top: 2px; }

.contact__value {
  color: var(--c-ink);
  word-break: break-word;
}

.contact__value:hover { color: var(--c-phosphor); }

/* Botón con relieve: se hunde al pulsarlo, como una tecla. */
.contact__cta {
  justify-self: start;
  display: inline-flex;
  align-items: center;
  gap: var(--s-3);
  padding: var(--s-3) var(--s-5);
  font-family: var(--f-display);
  font-size: var(--t-xs);
  letter-spacing: var(--ls-wide);
  text-transform: uppercase;
  color: var(--c-void);
  background: var(--c-phosphor);
  border: none;
  border-bottom: 0 solid transparent;
  box-shadow: var(--shadow-hard);
  transition: transform var(--d-fast) var(--ease-crt),
              box-shadow var(--d-fast) var(--ease-crt);
}

.contact__cta:hover {
  color: var(--c-void);
  transform: translate(-2px, -2px);
  box-shadow: var(--shadow-hard-lg);
}

.contact__cta:active {
  transform: translate(2px, 2px);
  box-shadow: 0 0 0 rgba(0, 0, 0, 0);
}

@media (min-width: 48rem) {
  .contact {
    grid-template-columns: minmax(0, 1fr) auto;
    gap: var(--s-8);
  }
}

@media (max-width: 30rem) {
  .contact__row { grid-template-columns: 1fr; gap: var(--s-1); }
}
</style>
