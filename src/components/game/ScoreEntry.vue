<script setup>
/**
 * ScoreEntry — entrada de iniciales estilo recreativa.
 *
 * Sin campo de texto: tres carretes que ciclan A-Z, como en
 * cualquier máquina de los 80. Eso evita el conflicto con la tecla
 * R (reinicio global de la pantalla de resultados) y con cualquier
 * atajo futuro — aquí no se escribe, se navega. Cada carrete es un
 * `spinbutton` real: flechas arriba/abajo cambian la letra, el
 * lector de pantalla anuncia el valor solo. Los botones ▲▼ dan el
 * mismo control a ratón y a dedo.
 */
import { ref, onMounted } from 'vue'
import { storage, STORAGE_KEYS } from '../../lib/storage.js'

const props = defineProps({
  pending:   { type: Boolean, default: false },
  submitted: { type: Boolean, default: false },
})

const emit = defineEmits(['submit'])

const A = 'A'.charCodeAt(0)

function defaultLetters() {
  const saved = String(storage.get(STORAGE_KEYS.INITIALS, ''))
    .toUpperCase()
    .replace(/[^A-Z]/g, '')
  return (saved.padEnd(3, 'A').slice(0, 3)).split('')
}

const letters = ref(defaultLetters())
const activeSlot = ref(0)
const slotRefs = []

function setSlotRef(el, i) {
  slotRefs[i] = el
}

function cycle(i, delta) {
  if (props.pending || props.submitted) return
  const code = letters.value[i].charCodeAt(0) - A
  letters.value[i] = String.fromCharCode(A + ((code + delta + 26) % 26))
}

function focusSlot(i) {
  const clamped = Math.max(0, Math.min(2, i))
  activeSlot.value = clamped
  slotRefs[clamped]?.focus()
}

function handleSubmit() {
  if (props.pending || props.submitted) return
  emit('submit', letters.value.join(''))
}

function onSlotKeydown(e, i) {
  switch (e.code) {
    case 'ArrowUp':    e.preventDefault(); cycle(i, 1); break
    case 'ArrowDown':  e.preventDefault(); cycle(i, -1); break
    case 'ArrowLeft':  e.preventDefault(); focusSlot(i - 1); break
    case 'ArrowRight': e.preventDefault(); focusSlot(i + 1); break
    case 'Enter':
      e.preventDefault()
      if (i < 2) focusSlot(i + 1)
      else handleSubmit()
      break
  }
}

// El foco entra en el primer carrete en cuanto aparece la pantalla
// de resultados: es un panel nuevo, no debe quedar sin foco.
onMounted(() => slotRefs[0]?.focus())
</script>

<template>
  <div class="entry">
    <p class="entry__label u-label">Tus iniciales</p>

    <div class="entry__slots" role="group" aria-label="Introduce tus iniciales, letra a letra">
      <div v-for="(letter, i) in letters" :key="i" class="slot">
        <button
          type="button"
          class="slot__step"
          :disabled="pending || submitted"
          aria-label="Letra siguiente"
          tabindex="-1"
          @click="focusSlot(i); cycle(i, 1)"
        >▲</button>

        <div
          :ref="(el) => setSlotRef(el, i)"
          class="slot__letter"
          :class="{ 'is-active': activeSlot === i }"
          role="spinbutton"
          :aria-label="`Letra ${i + 1} de 3`"
          :aria-valuenow="letter.charCodeAt(0) - A + 1"
          aria-valuemin="1"
          aria-valuemax="26"
          :aria-valuetext="letter"
          :tabindex="pending || submitted ? -1 : 0"
          :aria-disabled="pending || submitted ? 'true' : undefined"
          @keydown="onSlotKeydown($event, i)"
          @focus="activeSlot = i"
        >{{ letter }}</div>

        <button
          type="button"
          class="slot__step"
          :disabled="pending || submitted"
          aria-label="Letra anterior"
          tabindex="-1"
          @click="focusSlot(i); cycle(i, -1)"
        >▼</button>
      </div>

      <button
        type="button"
        class="entry__ok"
        :disabled="pending || submitted"
        @click="handleSubmit"
      >
        {{ submitted ? 'Guardado' : pending ? 'Enviando…' : 'OK' }}
      </button>
    </div>

    <p class="entry__hint">
      <kbd>↑↓</kbd> cambia letra · <kbd>←→</kbd> mueve · <kbd>Enter</kbd> confirma
    </p>
  </div>
</template>

<style scoped>
.entry {
  display: grid;
  gap: var(--s-3);
  justify-items: center;
  text-align: center;
}

.entry__slots {
  display: inline-flex;
  align-items: center;
  gap: var(--s-3);
}

.slot {
  display: grid;
  justify-items: center;
  gap: var(--s-1);
}

.slot__step {
  width: 2rem;
  height: 1.5rem;
  display: grid;
  place-items: center;
  color: var(--c-ink-dim);
  border: 1px solid var(--c-line);
  background: var(--c-panel);
  transition: color var(--d-fast) var(--ease-crt),
              border-color var(--d-fast) var(--ease-crt);
}

.slot__step:hover:not(:disabled) {
  color: var(--c-phosphor);
  border-color: var(--c-phosphor);
}

.slot__step:disabled { opacity: 0.4; cursor: default; }

.slot__letter {
  width: 3rem;
  height: 3.5rem;
  display: grid;
  place-items: center;
  font-family: var(--f-numeric);
  font-size: 2.5rem;
  line-height: 1;
  color: var(--c-amber);
  background: var(--c-panel);
  border: 2px solid var(--c-grid);
  box-shadow: var(--shadow-hard);
  cursor: default;
}

.slot__letter.is-active {
  border-color: var(--c-phosphor);
  color: var(--c-phosphor);
  text-shadow: var(--glow-phosphor);
}

.entry__ok {
  align-self: stretch;
  padding-inline: var(--s-5);
  font-family: var(--f-display);
  font-size: var(--t-xs);
  letter-spacing: var(--ls-wide);
  text-transform: uppercase;
  color: var(--c-void);
  background: var(--c-phosphor);
  box-shadow: var(--shadow-hard);
  transition: transform var(--d-fast) var(--ease-crt),
              box-shadow var(--d-fast) var(--ease-crt),
              opacity var(--d-fast) var(--ease-crt);
}

.entry__ok:hover:not(:disabled) {
  transform: translate(-2px, -2px);
  box-shadow: var(--shadow-hard-lg);
}

.entry__ok:disabled { opacity: 0.6; cursor: default; }

.entry__hint {
  font-size: var(--t-xs);
  color: var(--c-ink-faint);
}

.entry__hint kbd {
  font-family: var(--f-body);
  padding: 1px var(--s-1);
  border: 1px solid var(--c-line);
  background: var(--c-panel);
}

@media (max-width: 26rem) {
  .entry__hint { display: none; }
}
</style>
