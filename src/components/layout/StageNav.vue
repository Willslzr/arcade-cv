<script setup>
/**
 * StageNav — selector de sección, al estilo de un "stage select".
 *
 * Es la respuesta a "quiero pestañas" sin los costes de las
 * pestañas: son anclas reales, así que todo el contenido sigue en
 * el documento (Ctrl+F lo encuentra, Google lo indexa, un lector de
 * pantalla lo recorre) y el visitante puede seguir haciendo scroll
 * si prefiere no elegir.
 *
 * La sección activa se detecta con IntersectionObserver, no con
 * listeners de scroll: el navegador hace el trabajo y no cuesta
 * fotogramas.
 */
import { ref, onMounted, onBeforeUnmount } from 'vue'

const props = defineProps({
  stages: { type: Array, required: true }, // [{ id, label }]
})

const active = ref(props.stages[0]?.id ?? null)
let observer = null

onMounted(() => {
  const targets = props.stages
    .map((s) => document.getElementById(s.id))
    .filter(Boolean)

  if (!targets.length || !('IntersectionObserver' in window)) return

  observer = new IntersectionObserver(
    (entries) => {
      // Se toma la sección visible más alta, no la última en cambiar:
      // con dos secciones a la vez, gana la de arriba.
      const visible = entries
        .filter((e) => e.isIntersecting)
        .sort((a, b) => a.boundingClientRect.top - b.boundingClientRect.top)
      if (visible[0]) active.value = visible[0].target.id
    },
    // El margen superior descuenta el HUD para que la sección se
    // marque cuando de verdad está bajo la barra.
    { rootMargin: '-25% 0px -60% 0px', threshold: 0 }
  )

  targets.forEach((t) => observer.observe(t))
})

onBeforeUnmount(() => observer?.disconnect())
</script>

<template>
  <nav class="nav" aria-label="Secciones del CV">
    <ul class="nav__list">
      <li v-for="(stage, i) in stages" :key="stage.id">
        <a
          :href="`#${stage.id}`"
          class="nav__link"
          :class="{ 'is-active': active === stage.id }"
          :aria-current="active === stage.id ? 'true' : undefined"
        >
          <span class="nav__n">{{ String(i + 1).padStart(2, '0') }}</span>
          <span class="nav__label">{{ stage.label }}</span>
        </a>
      </li>
    </ul>
  </nav>
</template>

<style scoped>
.nav {
  position: sticky;
  inset-block-start: var(--hud-h);
  z-index: calc(var(--z-hud) - 1);
  background: rgba(4, 6, 10, 0.92);
  backdrop-filter: blur(6px);
  border-bottom: 1px solid var(--c-line);
  margin-inline: calc(var(--s-5) * -1);
  padding-inline: var(--s-5);
}

.nav__list {
  display: flex;
  gap: var(--s-1);
  margin: 0;
  padding: 0;
  list-style: none;
  overflow-x: auto;
  scrollbar-width: none;
}

.nav__list::-webkit-scrollbar { display: none; }

.nav__link {
  display: inline-flex;
  align-items: baseline;
  gap: var(--s-2);
  padding: var(--s-3) var(--s-3);
  white-space: nowrap;
  border-bottom: 2px solid transparent;
  color: var(--c-ink-dim);
  transition: color var(--d-fast) var(--ease-crt),
              border-color var(--d-fast) var(--ease-crt);
}

.nav__link:hover {
  color: var(--c-ink);
  border-bottom-color: var(--c-grid);
}

.nav__link.is-active {
  color: var(--c-phosphor);
  border-bottom-color: var(--c-phosphor);
}

.nav__n {
  font-family: var(--f-numeric);
  font-size: 1rem;
  line-height: 1;
  color: var(--c-amber);
}

.nav__label {
  font-family: var(--f-display);
  font-size: var(--t-2xs);
  letter-spacing: var(--ls-wide);
  text-transform: uppercase;
}
</style>
