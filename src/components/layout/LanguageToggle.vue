<script setup>
/**
 * LanguageToggle — cambia el idioma del CV.
 *
 * El texto del botón es el idioma AL QUE cambia, no el actual: así
 * es una instrucción ("English" → pulsa para pasar a inglés), no una
 * etiqueta de estado que haya que interpretar. Sólo afecta al CV —
 * el juego se queda en español siempre, por diseño (ver
 * translations.js) — así que este control desaparece en cuanto
 * empieza la partida.
 */
defineProps({
  label: { type: String, required: true },
  ariaLabel: { type: String, required: true },
})

const emit = defineEmits(['toggle'])
</script>

<template>
  <button type="button" class="lang" @click="emit('toggle')" :aria-label="ariaLabel">
    <span class="lang__glyph" aria-hidden="true">⇄</span>
    {{ label }}
  </button>
</template>

<style scoped>
.lang {
  position: fixed;
  inset-block-start: calc(var(--hud-h) + var(--s-2));
  inset-inline-end: var(--s-4);
  z-index: var(--z-hud);
  display: inline-flex;
  align-items: center;
  gap: var(--s-1);
  padding: var(--s-1) var(--s-3);
  font-family: var(--f-display);
  font-size: var(--t-2xs);
  letter-spacing: var(--ls-wide);
  text-transform: uppercase;
  color: var(--c-ink-dim);
  background: var(--c-panel);
  border: 1px solid var(--c-grid);
  box-shadow: var(--shadow-hard);
  transition: color var(--d-fast) var(--ease-crt),
              border-color var(--d-fast) var(--ease-crt);
}

.lang:hover,
.lang:focus-visible {
  color: var(--c-phosphor);
  border-color: var(--c-phosphor);
}

.lang__glyph { font-size: var(--t-xs); }

@media (max-width: 30rem) {
  .lang { inset-inline-end: var(--s-3); padding: var(--s-1) var(--s-2); }
}
</style>
