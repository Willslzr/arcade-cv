<script setup>
/**
 * StackInventory — el stack principal como ficha de personaje.
 *
 * 4 columnas — Back, Front, Database, Miscellaneous — como el
 * inventario de un RPG con sus categorías de objetos. Cada
 * tecnología es una ficha con icono real (Simple Icons,
 * `fill: currentColor` — el color sale de tokens.css, nunca de la
 * marca), nivel en barra y una nota de para qué se ha usado de
 * verdad.
 *
 * `item.lead` destaca como mucho UNA tecnología por columna (el
 * arma equipada de esa categoría): repartir la misma etiqueta a
 * varias a la vez le quita el sentido.
 */
import { techIcons } from '../../assets/icons/techIcons.js'
import { useLocale } from '../../composables/useLocale.js'

defineProps({
  columns: { type: Array, required: true }, // [{ id, label, items: [{ label, icon|iconText, level, note, lead? }] }]
})

const { t } = useLocale()
</script>

<template>
  <section class="inv" aria-labelledby="inv-title">
    <h2 id="inv-title" class="inv__title">
      <span class="inv__pip" aria-hidden="true"></span>
      {{ t('stack.title') }}
    </h2>

    <div class="inv__window">
      <ul class="inv__columns">
        <li v-for="col in columns" :key="col.id" class="inv__col">
          <h3 class="inv__col-title">{{ col.label }}</h3>

          <ul class="inv__list">
            <li
              v-for="item in col.items"
              :key="item.label"
              class="inv__item"
              :class="{ 'is-lead': item.lead }"
              tabindex="0"
            >
              <span class="inv__icon" aria-hidden="true">
                <svg v-if="item.icon && techIcons[item.icon]" viewBox="0 0 24 24">
                  <path :d="techIcons[item.icon]" />
                </svg>
                <span v-else class="inv__icon-mono">{{ item.iconText }}</span>
              </span>

              <span class="inv__info">
                <span class="inv__row">
                  <span class="inv__label">{{ item.label }}</span>
                  <span class="inv__level">{{ item.level }}<i>/100</i></span>
                </span>
                <span
                  class="inv__bar"
                  role="meter"
                  :aria-valuenow="item.level"
                  aria-valuemin="0"
                  aria-valuemax="100"
                  :aria-label="`${item.label}: nivel ${item.level} de 100`"
                >
                  <span class="inv__fill" :style="{ '--lvl': `${item.level}%` }"></span>
                </span>
                <span class="inv__note">{{ item.note }}</span>
              </span>

              <span v-if="item.lead" class="u-sr-only">(equipado)</span>
            </li>
          </ul>
        </li>
      </ul>
    </div>
  </section>
</template>

<style scoped>
.inv {
  padding-block: var(--s-5) var(--s-6);
  border-block: 1px solid var(--c-line);
}

.inv__title {
  display: flex;
  align-items: center;
  gap: var(--s-2);
  font-size: var(--t-2xs);
  letter-spacing: var(--ls-xwide);
  color: var(--c-ink-faint);
  margin-bottom: var(--s-4);
}

.inv__pip {
  width: 6px;
  height: 6px;
  background: var(--c-phosphor);
  box-shadow: var(--glow-phosphor);
}

/* --- Ventana ------------------------------------------------ */
.inv__window {
  padding: var(--s-5);
  border: 2px solid var(--c-grid);
  background: var(--c-panel);
  box-shadow: var(--shadow-hard);
}

/* --- Columnas -------------------------------------------------- */
.inv__columns {
  display: grid;
  gap: var(--s-6);
  margin: 0;
  padding: 0;
  list-style: none;
}

.inv__col-title {
  font-family: var(--f-display);
  font-size: var(--t-2xs);
  letter-spacing: var(--ls-wide);
  text-transform: uppercase;
  color: var(--c-amber);
  padding-bottom: var(--s-2);
  margin-bottom: var(--s-3);
  border-bottom: 1px dashed var(--c-line);
}

.inv__list {
  display: grid;
  gap: var(--s-3);
  margin: 0;
  padding: 0;
  list-style: none;
}

.inv__item {
  display: flex;
  gap: var(--s-3);
  padding: var(--s-2);
  border: 1px solid transparent;
  transition: border-color var(--d-fast) var(--ease-crt),
              background var(--d-fast) var(--ease-crt);
}

.inv__item:hover,
.inv__item:focus-visible {
  border-color: var(--c-phosphor-lo);
  background: var(--c-panel-hi);
}

.inv__icon {
  flex: none;
  width: 26px;
  height: 26px;
  display: grid;
  place-items: center;
  background: var(--c-void);
  border: 1px solid var(--c-line);
}

.inv__icon svg { width: 15px; height: 15px; fill: var(--c-ink-dim); }
.inv__icon-mono {
  font-family: var(--f-display);
  font-size: 8px;
  color: var(--c-ink-dim);
}

.inv__info {
  display: grid;
  gap: 2px;
  min-width: 0;
  flex: 1;
}

.inv__row {
  display: flex;
  align-items: baseline;
  justify-content: space-between;
  gap: var(--s-2);
}

.inv__label {
  font-family: var(--f-display);
  font-size: var(--t-2xs);
  letter-spacing: var(--ls-wide);
  text-transform: uppercase;
  color: var(--c-ink);
}

.inv__level {
  font-family: var(--f-numeric);
  font-size: 0.9rem;
  color: var(--c-amber);
}

.inv__level i { font-style: normal; color: var(--c-ink-faint); font-size: 0.7rem; }

.inv__bar {
  height: 6px;
  padding: 1px;
  border: 1px solid var(--c-line);
  background: var(--c-void);
}

.inv__fill {
  display: block;
  height: 100%;
  width: var(--lvl);
  background: var(--c-ink-faint);
}

.inv__note {
  font-size: 11px;
  color: var(--c-ink-faint);
  line-height: 1.3;
}

/* La tecnología "equipada" de cada columna: icono y barra en
   fósforo. Como mucho una por lista. */
.inv__item.is-lead .inv__icon {
  border-color: var(--c-phosphor);
  background: var(--c-panel);
}
.inv__item.is-lead .inv__icon svg { fill: var(--c-phosphor); }
.inv__item.is-lead .inv__icon-mono { color: var(--c-phosphor); }
.inv__item.is-lead .inv__label { color: var(--c-phosphor); }
.inv__item.is-lead .inv__fill {
  background: var(--c-phosphor);
  box-shadow: var(--glow-phosphor);
}

@media (min-width: 40rem) {
  .inv__columns { grid-template-columns: repeat(2, minmax(0, 1fr)); }
}

@media (min-width: 60rem) {
  .inv__columns { grid-template-columns: repeat(4, minmax(0, 1fr)); }
}
</style>
