<script setup>
/**
 * HeroCard — la portada y el detonante del juego.
 *
 * Es lo primero que se ve y lo único interactivo antes del scroll.
 * El avatar es el botón: al pasar el ratón revela "PULSA START" y
 * al activarlo dispara la secuencia de glitch. Es un <button> real
 * para que funcione con teclado y lo anuncien los lectores de
 * pantalla; la accesibilidad no se sacrifica por la puesta en escena.
 */
import { computed } from 'vue'

const props = defineProps({
  identity:  { type: Object, required: true },
  phase:     { type: String, required: true },
  glitchName:{ type: String, default: '' },
  glitchRole:{ type: String, default: '' },
  countdown: { type: Number, default: 0 },
})

const emit = defineEmits(['start'])

const isGlitch = computed(() => props.phase === 'glitch')

const nameText = computed(() =>
  isGlitch.value && props.glitchName ? props.glitchName : props.identity.name
)
const roleText = computed(() =>
  isGlitch.value && props.glitchRole ? props.glitchRole : props.identity.role
)
</script>

<template>
  <div class="hero" :data-phase="phase">

    <!-- Avatar / botón de arranque -->
    <button
      class="hero__avatar"
      type="button"
      :disabled="phase !== 'idle'"
      :aria-label="`Iniciar el juego. Avatar de ${identity.name}`"
      @click="emit('start')"
    >
      <img
        v-if="!isGlitch"
        class="hero__photo"
        :src="identity.avatar"
        :alt="identity.name"
        width="176"
        height="176"
      />
      <span v-if="!isGlitch" class="hero__cta" aria-hidden="true">
        <em class="hero__cta-arrow">▶</em>
        Pulsa start
      </span>
      <span v-else class="hero__count" aria-live="polite">{{ countdown }}</span>
    </button>

    <!-- Identidad -->
    <div class="hero__id">
      <p class="hero__eyebrow">
        <span class="hero__blink" aria-hidden="true">●</span>
        Insert coin — 1 crédito
      </p>

      <h1 class="hero__name" :class="{ 'crt-bleed': isGlitch, 'is-alert': isGlitch }">
        {{ nameText }}
      </h1>

      <p class="hero__role" :class="{ 'is-alert': isGlitch }">{{ roleText }}</p>

      <dl v-if="!isGlitch" class="hero__stats">
        <div class="hero__stat">
          <dt class="u-label">Nivel</dt>
          <dd class="hero__statval">{{ identity.level }}</dd>
        </div>
        <div class="hero__stat">
          <dt class="u-label">Base</dt>
          <dd class="hero__statval hero__statval--sm">{{ identity.base }}</dd>
        </div>
        <div class="hero__stat">
          <dt class="u-label">Clase</dt>
          <dd class="hero__statval hero__statval--sm">Analista / Dev</dd>
        </div>
      </dl>

      <p v-if="!isGlitch" class="hero__tagline">{{ identity.tagline }}</p>
    </div>

  </div>
</template>

<style scoped>
.hero {
  display: grid;
  gap: var(--s-6);
  justify-items: center;
  text-align: center;
  padding-block: var(--s-9) var(--s-8);
}

/* --- Avatar ------------------------------------------------ */
.hero__avatar {
  position: relative;
  width: 176px;
  height: 176px;
  padding: 0;
  overflow: hidden;
  background: var(--c-panel);
  border: 3px solid var(--c-phosphor);
  box-shadow: var(--shadow-hard-lg), var(--glow-phosphor);
  cursor: pointer;
  transition: box-shadow var(--d-base) var(--ease-crt);
}

.hero__avatar:disabled { cursor: default; }

.hero__photo {
  width: 100%;
  height: 100%;
  object-fit: cover;
  filter: saturate(0.6) contrast(1.1);
  transition: opacity var(--d-base) var(--ease-crt),
              filter var(--d-base) var(--ease-crt);
}

.hero__avatar:hover:not(:disabled) .hero__photo,
.hero__avatar:focus-visible .hero__photo {
  opacity: 0.18;
  filter: saturate(0) contrast(1.4);
}

.hero__cta {
  position: absolute;
  inset: 0;
  display: grid;
  place-content: center;
  gap: var(--s-2);
  font-family: var(--f-display);
  font-size: var(--t-xs);
  letter-spacing: var(--ls-wide);
  text-transform: uppercase;
  color: var(--c-phosphor);
  opacity: 0;
  transition: opacity var(--d-base) var(--ease-crt);
}

.hero__avatar:hover:not(:disabled) .hero__cta,
.hero__avatar:focus-visible .hero__cta { opacity: 1; }

.hero__cta-arrow {
  display: block;
  font-size: 1.6rem;
  font-style: normal;
  line-height: 1;
}

.hero__count {
  position: absolute;
  inset: 0;
  display: grid;
  place-content: center;
  font-family: var(--f-numeric);
  font-size: 6rem;
  line-height: 1;
  color: var(--c-magenta);
  background: var(--c-void);
  text-shadow: var(--glow-magenta);
}

/* --- Identidad --------------------------------------------- */
.hero__id {
  display: grid;
  gap: var(--s-3);
  justify-items: center;
  max-width: 46rem;
}

.hero__eyebrow {
  display: inline-flex;
  align-items: center;
  gap: var(--s-2);
  font-family: var(--f-display);
  font-size: var(--t-2xs);
  letter-spacing: var(--ls-xwide);
  text-transform: uppercase;
  color: var(--c-ink-faint);
}

.hero__blink {
  color: var(--c-magenta);
  animation: blink 1.4s steps(1, end) infinite;
}

@keyframes blink {
  0%, 49%  { opacity: 1; }
  50%, 100%{ opacity: 0; }
}

.hero__name {
  font-size: var(--t-2xl);
  color: var(--c-phosphor);
  white-space: pre-wrap;
  word-break: break-word;
}

.hero__role {
  font-family: var(--f-display);
  font-size: var(--t-xs);
  letter-spacing: var(--ls-wide);
  text-transform: uppercase;
  color: var(--c-ink-dim);
  white-space: pre-wrap;
}

.is-alert {
  color: var(--c-magenta);
  animation: jitter 0.28s steps(2, end) infinite;
}

@keyframes jitter {
  0%   { transform: translate(0, 0); }
  25%  { transform: translate(-1px, 1px); }
  50%  { transform: translate(1px, -1px); }
  75%  { transform: translate(-1px, -1px); }
  100% { transform: translate(0, 0); }
}

/* --- Stats -------------------------------------------------- */
.hero__stats {
  display: flex;
  flex-wrap: wrap;
  justify-content: center;
  gap: var(--s-2) 0;
  margin: var(--s-3) 0 0;
  border: 1px solid var(--c-line);
  background: var(--c-panel);
}

.hero__stat {
  display: grid;
  gap: var(--s-1);
  padding: var(--s-3) var(--s-5);
  border-inline-end: 1px solid var(--c-line);
}

.hero__stat:last-child { border-inline-end: none; }

.hero__statval {
  margin: 0;
  font-family: var(--f-numeric);
  font-size: 1.5rem;
  line-height: 1;
  color: var(--c-amber);
}

.hero__statval--sm {
  font-family: var(--f-body);
  font-size: var(--t-sm);
  color: var(--c-ink);
}

.hero__tagline {
  margin-top: var(--s-3);
  color: var(--c-ink-dim);
  font-size: var(--t-sm);
  max-width: var(--w-prose);
}

/* En fase de glitch el bloque se centra vertical: el CV
   desaparece y sólo queda la cuenta atrás. */
.hero[data-phase='glitch'] {
  min-height: 100dvh;
  align-content: center;
  padding-block: var(--s-6);
}

@media (max-width: 30rem) {
  .hero__stats { flex-direction: column; }
  .hero__stat  { border-inline-end: none; border-bottom: 1px solid var(--c-line); }
  .hero__stat:last-child { border-bottom: none; }
}
</style>
