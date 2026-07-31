<script setup>
/**
 * Leaderboard — top 20 del ranking global.
 *
 * `status` viene tal cual de useLeaderboard: idle | loading | ready
 * | offline. En offline no hay que ocultar la lista ni dejarla en
 * blanco — hay que decirlo. Es el mismo dato (localStorage) que ya
 * se muestra, sólo que sin sincronizar con el servidor.
 */
const props = defineProps({
  entries:   { type: Array, default: () => [] },
  status:    { type: String, default: 'idle' },
  /** { initials, score } de la entrada recién enviada, para resaltarla */
  highlight: { type: Object, default: null },
})

function isHighlighted(entry) {
  return Boolean(props.highlight) &&
    entry.initials === props.highlight.initials &&
    entry.score === props.highlight.score
}

const pad = (n) => String(Math.max(0, Math.floor(n))).padStart(6, '0')
</script>

<template>
  <section class="board" aria-labelledby="board-title">
    <div class="board__head">
      <h2 id="board-title" class="board__title u-label">Ranking</h2>
      <p v-if="status === 'offline'" class="board__notice board__notice--offline" aria-live="polite">
        <span aria-hidden="true">▲</span> Marcador local — sin conexión
      </p>
      <p v-else-if="status === 'loading'" class="board__notice" aria-live="polite">Cargando ranking…</p>
    </div>

    <table v-if="entries.length" class="board__table">
      <caption class="u-sr-only">Top {{ entries.length }} puntuaciones</caption>
      <thead>
        <tr>
          <th scope="col">#</th>
          <th scope="col">Piloto</th>
          <th scope="col">Puntos</th>
          <th scope="col">Oleada</th>
        </tr>
      </thead>
      <tbody>
        <tr
          v-for="(entry, i) in entries"
          :key="`${entry.initials}-${entry.at}-${i}`"
          class="board__row"
          :class="{ 'is-new': isHighlighted(entry) }"
        >
          <td class="board__rank">{{ String(i + 1).padStart(2, '0') }}</td>
          <td class="board__initials">
            {{ entry.initials }}
            <span v-if="isHighlighted(entry)" class="board__tag">NUEVO</span>
          </td>
          <td class="board__score">{{ pad(entry.score) }}</td>
          <td class="board__wave">{{ entry.wave ?? '—' }}</td>
        </tr>
      </tbody>
    </table>

    <p v-else class="board__empty">Todavía no hay puntuaciones. Sé el primero.</p>
  </section>
</template>

<style scoped>
.board {
  display: grid;
  gap: var(--s-3);
  width: min(100%, 28rem);
}

.board__head {
  display: flex;
  flex-wrap: wrap;
  align-items: baseline;
  justify-content: space-between;
  gap: var(--s-2);
}

.board__notice {
  font-size: var(--t-xs);
  color: var(--c-ink-dim);
}

.board__notice--offline {
  display: inline-flex;
  align-items: center;
  gap: var(--s-1);
  color: var(--c-amber);
}

.board__table {
  width: 100%;
  border-collapse: collapse;
  font-size: var(--t-sm);
}

.board__table th {
  padding: var(--s-2) var(--s-2);
  font-family: var(--f-display);
  font-size: var(--t-2xs);
  letter-spacing: var(--ls-wide);
  text-transform: uppercase;
  color: var(--c-ink-faint);
  text-align: left;
  border-bottom: 1px solid var(--c-line);
}

.board__table th:first-child,
.board__table td:first-child { text-align: right; }

.board__row td {
  padding: var(--s-2);
  border-bottom: 1px solid var(--c-line);
}

.board__rank {
  font-family: var(--f-numeric);
  color: var(--c-ink-dim);
}

.board__initials {
  font-family: var(--f-display);
  letter-spacing: var(--ls-wide);
  color: var(--c-ink);
}

.board__score {
  font-family: var(--f-numeric);
  font-size: 1.125rem;
  color: var(--c-amber);
  font-variant-numeric: tabular-nums;
}

.board__wave {
  font-family: var(--f-numeric);
  color: var(--c-ink-dim);
}

/* La fila recién enviada se resalta con el mismo fósforo que el
   resto de la identidad del sitio, no con un color nuevo. */
.board__row.is-new {
  background: rgba(56, 237, 172, 0.08);
}

.board__row.is-new .board__initials,
.board__row.is-new .board__score {
  color: var(--c-phosphor);
  text-shadow: var(--glow-phosphor);
}

.board__tag {
  margin-inline-start: var(--s-2);
  padding: 1px var(--s-1);
  font-family: var(--f-display);
  font-size: var(--t-2xs);
  letter-spacing: var(--ls-wide);
  background: var(--c-phosphor);
  color: var(--c-void);
}

.board__empty {
  padding: var(--s-4);
  text-align: center;
  color: var(--c-ink-dim);
  border: 1px dashed var(--c-line);
}
</style>
