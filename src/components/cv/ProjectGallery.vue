<script setup>
/**
 * ProjectGallery — proyectos como cartuchos de una estantería.
 *
 * Por qué filtro y no pestañas: unas pestañas esconden contenido
 * del buscador del navegador, del Ctrl+F y del lector de pantalla,
 * y obligan a un clic antes de ver nada. Un filtro parte del estado
 * "todo visible" y sólo reduce si el visitante lo pide. Un reclutador
 * que busca "Laravel" lo encuentra sin tocar nada; el que quiera
 * acotar, puede.
 *
 * Cuando un proyecto no tiene portada se dibuja un marcador
 * pixel-art derivado de su id: siempre el mismo para el mismo
 * proyecto, distinto entre proyectos. Así la rejilla nunca tiene
 * huecos mientras preparas las capturas.
 */
import { ref, computed } from 'vue'

const props = defineProps({
  items: { type: Array, required: true },
})

const activeFilter = ref('all')

/** Tecnologías presentes, ordenadas por frecuencia. */
const technologies = computed(() => {
  const count = new Map()
  for (const p of props.items) {
    for (const tech of p.stack ?? []) {
      count.set(tech, (count.get(tech) ?? 0) + 1)
    }
  }
  return [...count.entries()]
    .sort((a, b) => b[1] - a[1] || a[0].localeCompare(b[0]))
    .map(([label, n]) => ({ label, n }))
})

const visible = computed(() =>
  activeFilter.value === 'all'
    ? props.items
    : props.items.filter((p) => p.stack?.includes(activeFilter.value))
)

/**
 * Patrón determinista para la portada ausente. Hash simple del id
 * → rejilla 6×4 simétrica, al estilo de una etiqueta de cartucho.
 */
function pattern(id) {
  let h = 0
  for (let i = 0; i < id.length; i++) h = (h * 31 + id.charCodeAt(i)) >>> 0

  const cells = []
  for (let y = 0; y < 4; y++) {
    for (let x = 0; x < 3; x++) {
      const on = ((h >> (y * 3 + x)) & 1) === 1
      if (on) {
        cells.push({ x, y })
        cells.push({ x: 5 - x, y }) // espejo vertical
      }
    }
  }
  return cells
}
</script>

<template>
  <div class="gal">

    <!-- Filtro. Sólo aparece si hay más de una tecnología. -->
    <div v-if="technologies.length > 1" class="gal__filter" role="group" aria-label="Filtrar proyectos por tecnología">
      <button
        type="button"
        class="gal__pill"
        :class="{ 'is-on': activeFilter === 'all' }"
        :aria-pressed="activeFilter === 'all'"
        @click="activeFilter = 'all'"
      >
        Todos <span class="gal__n">{{ items.length }}</span>
      </button>

      <button
        v-for="tech in technologies"
        :key="tech.label"
        type="button"
        class="gal__pill"
        :class="{ 'is-on': activeFilter === tech.label }"
        :aria-pressed="activeFilter === tech.label"
        @click="activeFilter = tech.label"
      >
        {{ tech.label }} <span class="gal__n">{{ tech.n }}</span>
      </button>
    </div>

    <ul class="gal__grid">
      <li
        v-for="project in visible"
        :key="project.id"
        class="card"
        :class="{ 'is-featured': project.featured }"
      >
        <!-- Portada -->
        <div class="card__cover">
          <img
            v-if="project.cover"
            :src="project.cover"
            :alt="`Captura de ${project.name}`"
            class="card__img"
            loading="lazy"
            width="600"
            height="375"
          />
          <svg
            v-else
            class="card__glyph pixelated"
            viewBox="0 0 6 4"
            aria-hidden="true"
            shape-rendering="crispEdges"
          >
            <rect
              v-for="(cell, i) in pattern(project.id)"
              :key="i"
              :x="cell.x"
              :y="cell.y"
              width="1"
              height="1"
            />
          </svg>

          <span class="card__year">{{ project.year }}</span>
        </div>

        <!-- Cuerpo -->
        <div class="card__body">
          <h3 class="card__name">{{ project.name }}</h3>
          <p class="card__summary">{{ project.summary }}</p>

          <dl class="card__facts">
            <dt class="u-label">Problema</dt>
            <dd class="card__fact">{{ project.problem }}</dd>
            <dt class="u-label">Solución</dt>
            <dd class="card__fact">{{ project.detail }}</dd>
          </dl>

          <ul class="card__stack">
            <li v-for="tech in project.stack" :key="tech" class="card__tech">{{ tech }}</li>
          </ul>

          <p v-if="project.links?.length" class="card__links">
            <a
              v-for="link in project.links"
              :key="link.href"
              :href="link.href"
              rel="noopener"
              target="_blank"
            >{{ link.label }} ↗</a>
          </p>
        </div>
      </li>
    </ul>

    <p v-if="!visible.length" class="gal__empty">
      Ningún proyecto usa {{ activeFilter }} todavía.
    </p>
  </div>
</template>

<style scoped>
.gal { display: grid; gap: var(--s-5); }

/* --- Filtro ------------------------------------------------- */
.gal__filter {
  display: flex;
  flex-wrap: wrap;
  gap: var(--s-2);
}

.gal__pill {
  display: inline-flex;
  align-items: center;
  gap: var(--s-2);
  padding: var(--s-2) var(--s-3);
  font-family: var(--f-display);
  font-size: var(--t-2xs);
  letter-spacing: var(--ls-wide);
  text-transform: uppercase;
  color: var(--c-ink-dim);
  background: var(--c-panel);
  border: 1px solid var(--c-grid);
  transition: color var(--d-fast) var(--ease-crt),
              border-color var(--d-fast) var(--ease-crt);
}

.gal__pill:hover { border-color: var(--c-phosphor-lo); color: var(--c-ink); }

.gal__pill.is-on {
  color: var(--c-void);
  background: var(--c-phosphor);
  border-color: var(--c-phosphor);
}

.gal__n {
  font-family: var(--f-numeric);
  font-size: 1rem;
  line-height: 1;
  opacity: 0.75;
}

.gal__empty {
  padding: var(--s-5);
  border: 1px dashed var(--c-line);
  color: var(--c-ink-dim);
  font-size: var(--t-sm);
}

/* --- Rejilla ------------------------------------------------ */
.gal__grid {
  display: grid;
  gap: var(--s-5);
  margin: 0;
  padding: 0;
  list-style: none;
}

.card {
  display: grid;
  grid-template-rows: auto 1fr;
  background: var(--c-panel);
  border: 2px solid var(--c-grid);
  box-shadow: var(--shadow-hard);
  transition: transform var(--d-fast) var(--ease-crt),
              box-shadow var(--d-fast) var(--ease-crt),
              border-color var(--d-fast) var(--ease-crt);
}

.card:hover {
  transform: translate(-2px, -2px);
  box-shadow: var(--shadow-hard-lg);
  border-color: var(--c-phosphor-lo);
}

.card.is-featured { border-color: var(--c-phosphor); }

/* --- Portada ------------------------------------------------ */
.card__cover {
  position: relative;
  aspect-ratio: 16 / 10;
  display: grid;
  place-items: center;
  overflow: hidden;
  background: var(--c-void);
  border-bottom: 2px solid var(--c-grid);
}

.card__img {
  width: 100%;
  height: 100%;
  object-fit: cover;
  filter: saturate(0.75) contrast(1.05);
}

.card__glyph {
  width: 45%;
  max-width: 132px;
  fill: var(--c-phosphor-lo);
}

.card__year {
  position: absolute;
  inset-block-start: var(--s-2);
  inset-inline-end: var(--s-2);
  padding: 2px var(--s-2);
  font-family: var(--f-numeric);
  font-size: 1.05rem;
  line-height: 1.2;
  color: var(--c-amber);
  background: rgba(4, 6, 10, 0.85);
  border: 1px solid var(--c-line);
}

/* --- Cuerpo ------------------------------------------------- */
.card__body {
  display: grid;
  align-content: start;
  gap: var(--s-3);
  padding: var(--s-5);
}

.card__name {
  font-size: var(--t-lg);
  color: var(--c-phosphor);
}

.card__summary { color: var(--c-ink); }

.card__facts {
  display: grid;
  gap: var(--s-1);
  margin: 0;
  padding-top: var(--s-3);
  border-top: 1px dashed var(--c-line);
}

.card__fact {
  margin: 0 0 var(--s-3);
  font-size: var(--t-sm);
  color: var(--c-ink-dim);
}

.card__fact:last-of-type { margin-bottom: 0; }

.card__stack {
  display: flex;
  flex-wrap: wrap;
  gap: var(--s-2);
  margin: var(--s-2) 0 0;
  padding: 0;
  list-style: none;
}

.card__tech {
  padding: 2px var(--s-2);
  font-family: var(--f-display);
  font-size: 10px;
  letter-spacing: var(--ls-wide);
  text-transform: uppercase;
  color: var(--c-ink-dim);
  border: 1px solid var(--c-line);
}

.card__links {
  display: flex;
  gap: var(--s-4);
  margin-top: var(--s-2);
  font-family: var(--f-display);
  font-size: var(--t-2xs);
  letter-spacing: var(--ls-wide);
  text-transform: uppercase;
}

@media (min-width: 52rem) {
  .gal__grid { grid-template-columns: repeat(2, minmax(0, 1fr)); }
  /* El destacado ocupa la fila entera: la jerarquía se ve antes
     de leer nada. */
  .card.is-featured { grid-column: 1 / -1; }
  .card.is-featured { grid-template-columns: minmax(0, 5fr) minmax(0, 6fr); grid-template-rows: none; }
  .card.is-featured .card__cover { aspect-ratio: auto; border-bottom: none; border-inline-end: 2px solid var(--c-grid); }
}
</style>
