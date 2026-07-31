<script setup>
/**
 * AboutPanel — la parte humana.
 *
 * Va después de proyectos a propósito: primero demuestras, luego
 * te presentas. Quien ha llegado hasta aquí ya está interesado, y
 * es cuando lo personal suma en vez de estorbar.
 *
 * Los principios se numeran porque son tres afirmaciones
 * independientes que se leen de un vistazo; los hobbies no, porque
 * no hay orden entre ellos: van como ranuras de partida guardada.
 */
defineProps({
  bio:        { type: Array, required: true },
  hobbies:    { type: Array, default: () => [] },
  principles: { type: Array, default: () => [] },
})
</script>

<template>
  <div class="about">

    <!-- Columna 1: la voz -->
    <div class="about__prose">
      <p v-for="(para, i) in bio" :key="i" class="about__para">{{ para }}</p>

      <ul v-if="principles.length" class="about__creed">
        <li v-for="(line, i) in principles" :key="i" class="about__rule">
          <span class="about__rule-n">{{ String(i + 1).padStart(2, '0') }}</span>
          <span class="about__rule-text">{{ line }}</span>
        </li>
      </ul>
    </div>

    <!-- Columna 2: ranuras de partida guardada -->
    <div v-if="hobbies.length" class="about__saves">
      <p class="u-label about__saves-title">Fuera del trabajo</p>

      <ul class="about__slots">
        <li v-for="(hobby, i) in hobbies" :key="hobby.id" class="slot">
          <div class="slot__head">
            <span class="slot__id">Slot {{ i + 1 }}</span>
            <span class="slot__dot" aria-hidden="true"></span>
          </div>
          <h3 class="slot__name">{{ hobby.label }}</h3>
          <p class="slot__detail">{{ hobby.detail }}</p>
        </li>
      </ul>
    </div>

  </div>
</template>

<style scoped>
.about {
  display: grid;
  gap: var(--s-7);
  align-items: start;
}

/* --- Prosa --------------------------------------------------- */
.about__para {
  max-width: var(--w-prose);
  margin-bottom: var(--s-4);
  color: var(--c-ink);
}

.about__creed {
  margin: var(--s-6) 0 0;
  padding: var(--s-5);
  list-style: none;
  border-inline-start: 2px solid var(--c-phosphor);
  background: var(--c-panel);
}

.about__rule {
  display: flex;
  gap: var(--s-3);
  align-items: baseline;
  padding-block: var(--s-2);
}

.about__rule + .about__rule { border-top: 1px dashed var(--c-line); }

.about__rule-n {
  font-family: var(--f-numeric);
  font-size: 1.1rem;
  line-height: 1;
  color: var(--c-amber);
  flex: none;
}

.about__rule-text {
  font-size: var(--t-sm);
  color: var(--c-ink-dim);
}

/* --- Ranuras ------------------------------------------------- */
.about__saves-title { display: block; margin-bottom: var(--s-3); }

.about__slots {
  display: grid;
  gap: var(--s-3);
  margin: 0;
  padding: 0;
  list-style: none;
}

.slot {
  padding: var(--s-4);
  background: var(--c-panel);
  border: 1px solid var(--c-grid);
  transition: border-color var(--d-fast) var(--ease-crt);
}

.slot:hover { border-color: var(--c-phosphor-lo); }

.slot__head {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: var(--s-2);
}

.slot__id {
  font-family: var(--f-display);
  font-size: 10px;
  letter-spacing: var(--ls-xwide);
  text-transform: uppercase;
  color: var(--c-ink-faint);
}

.slot__dot {
  width: 6px;
  height: 6px;
  background: var(--c-amber);
}

.slot__name {
  font-size: var(--t-md);
  color: var(--c-phosphor);
  margin-bottom: var(--s-1);
}

.slot__detail {
  font-size: var(--t-sm);
  color: var(--c-ink-dim);
}

@media (min-width: 56rem) {
  .about { grid-template-columns: minmax(0, 1.15fr) minmax(0, 1fr); gap: var(--s-8); }
}
</style>
