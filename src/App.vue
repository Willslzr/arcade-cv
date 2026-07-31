<script setup>
/**
 * App — compone la experiencia y cablea la máquina de estados.
 *
 * Reparto de responsabilidades:
 *   usePhase        → en qué fase estamos y qué transiciones valen
 *   useGlitch       → el texto corrompido durante la intro
 *   useReadProgress → el marcador del HUD
 *   useLeaderboard  → ranking global con degradación a localStorage
 *   useLocale       → idioma del CV y el contenido ya traducido
 *   GameCanvas      → todo lo que se dibuja a 60 fps
 *
 * App no calcula nada; sólo conecta.
 *
 * Orden de las secciones — es una decisión, no el orden en que se
 * escribieron. Un reclutador decide en este orden:
 *   01 Proyectos → ¿sabe hacerlo de verdad?
 *   02 Experiencia → ¿dónde lo ha hecho?
 *   03 Sobre mí → ¿quiero trabajar con esta persona?
 *   04 Contacto → cómo le escribo
 * Proyectos va antes que experiencia a propósito: la prueba pesa
 * más que el historial. El stack ya no tiene sección propia aquí
 * abajo: "Stack principal", sobre el pliegue, es la única vista y
 * cubre lo que antes duplicaba esta sección.
 */
import { ref, computed, nextTick, onMounted, onUnmounted, watch } from 'vue'

import { usePhase, PHASE } from './composables/usePhase.js'
import { useGlitch } from './composables/useGlitch.js'
import { useReadProgress } from './composables/useReadProgress.js'
import { useLeaderboard } from './composables/useLeaderboard.js'
import { useLocale } from './composables/useLocale.js'

import CrtOverlay from './components/layout/CrtOverlay.vue'
import HudBar from './components/layout/HudBar.vue'
import StageNav from './components/layout/StageNav.vue'
import StageSection from './components/layout/StageSection.vue'
import LanguageToggle from './components/layout/LanguageToggle.vue'
import GameCanvas from './components/game/GameCanvas.vue'
import ScoreEntry from './components/game/ScoreEntry.vue'
import Leaderboard from './components/game/Leaderboard.vue'

import HeroCard from './components/cv/HeroCard.vue'
import StackInventory from './components/cv/StackInventory.vue'
import ProjectGallery from './components/cv/ProjectGallery.vue'
import TimelineList from './components/cv/TimelineList.vue'
import AboutPanel from './components/cv/AboutPanel.vue'
import ContactRow from './components/cv/ContactRow.vue'

const {
  phase, countdown, isIdle, isGlitch, isOver, showsCv, lastRun,
  startSequence, abort, endRun, reset, restart,
} = usePhase()
const { score, ratio } = useReadProgress()
const { entries, status: lbStatus, best, load: loadScores, openRun, submit } = useLeaderboard()
const {
  locale, toggleLocale, t,
  identity, stackColumns, experience, projects, about, contact, glitchScript,
} = useLocale()

const nameGlitch = useGlitch()
const roleGlitch = useGlitch()

const COUNTDOWN_SECONDS = 10

/** Entrada recién enviada al ranking, para que Leaderboard la resalte. */
const submittedEntry = ref(null)
const submitPending = ref(false)
const hasSubmitted = computed(() => submittedEntry.value !== null)
const restartBtnRef = ref(null)

// Engine emite 'stats' sólo cuando algo cambia de verdad (puntos,
// oleada o vidas), no en cada fotograma: así el HUD no fuerza un
// render de Vue 60 veces por segundo por un objeto nuevo con los
// mismos números. Los valores sobreviven a game → over porque son
// justo el resumen final que interesa mostrar en esa pantalla.
const liveStats = ref({ score: 0, wave: 0, lives: 0 })
function handleStats(stats) {
  liveStats.value = stats
}
const gameScore = computed(() => liveStats.value.score)
const gameWave  = computed(() => liveStats.value.wave)
const gameLives = computed(() => liveStats.value.lives)

/** Índice de secciones. Una sola lista alimenta la nav y el render.
    Computada, no constante: los labels cambian con el idioma. */
const STAGES = computed(() => [
  { id: 'stage-proyectos',   label: t('nav.stages.proyectos') },
  { id: 'stage-experiencia', label: t('nav.stages.experiencia') },
  { id: 'stage-sobre-mi',    label: t('nav.stages.sobreMi') },
  { id: 'stage-contacto',    label: t('nav.stages.contacto') },
])

function handleStart() {
  if (!isIdle.value) return
  // Se reserva la partida en el servidor mientras corre la cuenta
  // atrás: para cuando el jugador dispara, el runId ya está listo.
  openRun()
  nameGlitch.run(glitchScript.value.nameFrom, glitchScript.value.nameTo)
  roleGlitch.run(glitchScript.value.roleFrom, glitchScript.value.roleTo)
  startSequence(COUNTDOWN_SECONDS)
}

/** Envía las iniciales; el runId ya viajó firmado desde openRun(). */
async function handleScoreSubmit(initials) {
  if (!lastRun.value || submitPending.value || hasSubmitted.value) return

  submitPending.value = true
  await submit({
    initials,
    score: lastRun.value.score,
    wave: lastRun.value.wave,
    durationMs: lastRun.value.durationMs,
  })
  submitPending.value = false

  // submit() no devuelve la entrada final; se reconstruye igual que
  // ella la normaliza, que es suficiente para que Leaderboard sepa
  // qué fila resaltar.
  submittedEntry.value = {
    initials: initials.toUpperCase().slice(0, 3),
    score: Math.floor(lastRun.value.score),
  }

  await nextTick()
  restartBtnRef.value?.focus()
}

/** Jugar de nuevo desde la pantalla de resultados: tecla R o botón. */
function handleRestart() {
  if (!isOver.value) return
  openRun()
  restart()
}

/** Escape aborta la intro y devuelve el CV. Salida siempre visible. */
function onKeydown(e) {
  if (e.key === 'Escape' && phase.value === PHASE.GLITCH) {
    nameGlitch.stop()
    roleGlitch.stop()
    abort()
  }
  if (e.code === 'KeyR' && phase.value === PHASE.OVER) {
    handleRestart()
  }
}

watch(phase, (next) => {
  if (next === PHASE.IDLE) {
    nameGlitch.stop()
    roleGlitch.stop()
  }
  // La entrada resaltada sólo tiene sentido en la propia pantalla
  // de resultados; fuera de ella es estado obsoleto.
  if (next !== PHASE.OVER) {
    submittedEntry.value = null
  }
})

onMounted(() => {
  loadScores()
  window.addEventListener('keydown', onKeydown)
})

onUnmounted(() => {
  window.removeEventListener('keydown', onKeydown)
  document.body.classList.remove('is-locked')
})

const year = new Date().getFullYear()
</script>

<template>
  <!-- Capa 0: el fondo vive desde el primer instante -->
  <GameCanvas :phase="phase" @gameover="endRun" @stats="handleStats" />

  <!-- Capa 60: el vidrio del monitor -->
  <CrtOverlay :phase="phase" />

  <!-- Capa 40: marcador. Fuera de idle/glitch pasa a mostrar la
       partida en vez del avance de lectura del CV. -->
  <HudBar
    :phase="phase"
    :score="showsCv ? score : gameScore"
    :hi-score="best"
    :progress="ratio"
    :wave="gameWave"
    :lives="gameLives"
  />

  <!-- Capa 10: contenido -->
  <div class="shell">
    <a href="#stage-proyectos" class="skip">{{ t('skip') }}</a>

    <LanguageToggle
      v-if="showsCv && !isGlitch"
      :label="t('languageToggle.switchTo')"
      :aria-label="t('languageToggle.ariaLabel')"
      @toggle="toggleLocale"
    />

    <main class="u-shell">
      <!-- Sólo existe fuera de la partida: en juego el canvas manda
           la pantalla completa, sin el CV superpuesto. -->
      <HeroCard
        v-if="showsCv"
        :identity="identity"
        :phase="phase"
        :glitch-name="nameGlitch.text.value"
        :glitch-role="roleGlitch.text.value"
        :countdown="countdown"
        @start="handleStart"
      />

      <template v-if="showsCv && !isGlitch">
        <!-- Lo primero que busca un reclutador, sobre el pliegue -->
        <StackInventory :columns="stackColumns" />

        <StageNav :stages="STAGES" />

        <StageSection
          id="stage-proyectos"
          :index="1"
          :title="t('nav.stages.proyectos')"
          :hint="t('hints.proyectos')"
        >
          <ProjectGallery :items="projects" />
        </StageSection>

        <StageSection
          id="stage-experiencia"
          :index="2"
          :title="t('nav.stages.experiencia')"
          :hint="t('hints.experiencia')"
        >
          <TimelineList :items="experience" />
        </StageSection>

        <StageSection
          id="stage-sobre-mi"
          :index="3"
          :title="t('nav.stages.sobreMi')"
          :hint="t('hints.sobreMi')"
        >
          <AboutPanel
            :bio="about.bio"
            :education="about.education"
            :hobbies="about.hobbies"
            :principles="about.principles"
          />
        </StageSection>

        <StageSection
          id="stage-contacto"
          :index="4"
          :title="t('nav.stages.contacto')"
          :hint="t('hints.contacto')"
        >
          <ContactRow :items="contact" :cv="identity.cv" />
        </StageSection>
      </template>

      <!-- Pantalla de resultados: fin de partida, iniciales y ranking -->
      <section v-else-if="isOver" class="over" aria-labelledby="over-heading">
        <h1 id="over-heading" class="over__title" :class="{ 'over__title--victory': lastRun?.victory }">
          {{ lastRun?.victory ? 'Mission Complete' : 'Game Over' }}
        </h1>

        <p class="over__summary">
          <span class="over__stat">
            <span class="u-label">Puntuación</span>
            {{ String(Math.max(0, Math.floor(lastRun?.score ?? 0))).padStart(6, '0') }}
          </span>
          <span class="over__stat">
            <span class="u-label">Oleada</span>
            {{ String(lastRun?.wave ?? 0).padStart(2, '0') }}
          </span>
        </p>

        <ScoreEntry
          :pending="submitPending"
          :submitted="hasSubmitted"
          @submit="handleScoreSubmit"
        />

        <Leaderboard
          :entries="entries"
          :status="lbStatus"
          :highlight="submittedEntry"
        />

        <div class="over__actions">
          <button ref="restartBtnRef" type="button" class="over__btn" @click="handleRestart">
            Jugar de nuevo <kbd>R</kbd>
          </button>
          <button type="button" class="over__btn over__btn--ghost" @click="reset">
            Volver al CV
          </button>
        </div>
      </section>
    </main>

    <footer v-if="showsCv && !isGlitch" class="foot u-shell">
      <p class="foot__line">
        <span class="u-label">{{ t('footer.build') }}</span>
        {{ t('footer.line', year) }}
      </p>
      <p class="foot__hint">{{ t('footer.hint') }}</p>
    </footer>
  </div>
</template>

<style scoped>
.shell {
  position: relative;
  z-index: var(--z-content);
  padding-top: var(--hud-h);
  min-height: 100dvh;
}

/* Enlace de salto: invisible hasta que recibe foco de teclado */
.skip {
  position: absolute;
  inset-block-start: calc(var(--s-4) * -4);
  inset-inline-start: var(--s-4);
  z-index: var(--z-modal);
  padding: var(--s-2) var(--s-4);
  background: var(--c-phosphor);
  color: var(--c-void);
  font-family: var(--f-display);
  font-size: var(--t-2xs);
  letter-spacing: var(--ls-wide);
  text-transform: uppercase;
  transition: inset-block-start var(--d-fast) var(--ease-crt);
}

.skip:focus {
  inset-block-start: var(--s-4);
  color: var(--c-void);
}

/* Las anclas se detienen bajo el HUD y la nav, no debajo de ellos */
.shell :deep(.stage) {
  scroll-margin-top: calc(var(--hud-h) + 52px);
}

/* --- Pantalla de resultados --------------------------------- */
.over {
  display: grid;
  justify-items: center;
  gap: var(--s-6);
  min-height: 100dvh;
  align-content: center;
  padding-block: var(--s-8);
  text-align: center;
}

.over__title {
  font-size: var(--t-2xl);
  color: var(--c-magenta);
  text-shadow: var(--glow-magenta);
}

.over__title--victory {
  color: var(--c-phosphor);
  text-shadow: var(--glow-phosphor);
}

.over__summary {
  display: flex;
  flex-wrap: wrap;
  justify-content: center;
  gap: var(--s-6);
}

.over__stat {
  display: grid;
  gap: var(--s-1);
  font-family: var(--f-numeric);
  font-size: 1.5rem;
  color: var(--c-amber);
}

.over__actions {
  display: flex;
  flex-wrap: wrap;
  justify-content: center;
  gap: var(--s-4);
}

.over__btn {
  padding: var(--s-3) var(--s-5);
  font-family: var(--f-display);
  font-size: var(--t-xs);
  letter-spacing: var(--ls-wide);
  text-transform: uppercase;
  color: var(--c-void);
  background: var(--c-phosphor);
  box-shadow: var(--shadow-hard);
  transition: transform var(--d-fast) var(--ease-crt),
              box-shadow var(--d-fast) var(--ease-crt);
}

.over__btn:hover {
  transform: translate(-2px, -2px);
  box-shadow: var(--shadow-hard-lg);
}

.over__btn kbd {
  font-family: var(--f-body);
  opacity: 0.7;
}

.over__btn--ghost {
  color: var(--c-ink);
  background: transparent;
  border: 1px solid var(--c-line);
  box-shadow: none;
}

.over__btn--ghost:hover {
  color: var(--c-phosphor);
  border-color: var(--c-phosphor);
  transform: none;
  box-shadow: none;
}

.foot {
  display: flex;
  flex-wrap: wrap;
  align-items: baseline;
  justify-content: space-between;
  gap: var(--s-3);
  padding-block: var(--s-6) var(--s-7);
  border-top: 1px solid var(--c-line);
  font-size: var(--t-xs);
  color: var(--c-ink-faint);
}

.foot__line {
  display: flex;
  align-items: baseline;
  gap: var(--s-3);
}

.foot__hint { color: var(--c-ink-dim); }
</style>
