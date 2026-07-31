<script setup>
/**
 * App — compone la experiencia y cablea la máquina de estados.
 *
 * Reparto de responsabilidades:
 *   usePhase        → en qué fase estamos y qué transiciones valen
 *   useGlitch       → el texto corrompido durante la intro
 *   useReadProgress → el marcador del HUD
 *   GameCanvas      → todo lo que se dibuja a 60 fps
 *
 * App no calcula nada; sólo conecta.
 *
 * Orden de las secciones — es una decisión, no el orden en que se
 * escribieron. Un reclutador decide en este orden:
 *   01 Stack  → ¿encaja con la vacante?
 *   02 Proyectos → ¿sabe hacerlo de verdad?
 *   03 Experiencia → ¿dónde lo ha hecho?
 *   04 Sobre mí → ¿quiero trabajar con esta persona?
 *   05 Contacto → cómo le escribo
 * Proyectos va antes que experiencia a propósito: la prueba pesa
 * más que el historial.
 */
import { onMounted, onUnmounted, watch } from 'vue'

import { usePhase, PHASE } from './composables/usePhase.js'
import { useGlitch } from './composables/useGlitch.js'
import { useReadProgress } from './composables/useReadProgress.js'
import { useLeaderboard } from './composables/useLeaderboard.js'

import CrtOverlay from './components/layout/CrtOverlay.vue'
import HudBar from './components/layout/HudBar.vue'
import StageNav from './components/layout/StageNav.vue'
import StageSection from './components/layout/StageSection.vue'
import GameCanvas from './components/game/GameCanvas.vue'

import HeroCard from './components/cv/HeroCard.vue'
import StackStrip from './components/cv/StackStrip.vue'
import StackGrid from './components/cv/StackGrid.vue'
import ProjectGallery from './components/cv/ProjectGallery.vue'
import TimelineList from './components/cv/TimelineList.vue'
import AboutPanel from './components/cv/AboutPanel.vue'
import ContactRow from './components/cv/ContactRow.vue'

import {
  identity, primaryStack, stack, toolbelt,
  projects, experience, about, contact, glitchScript,
} from './data/profile.js'

const { phase, countdown, isIdle, isGlitch, showsCv, startSequence, abort } = usePhase()
const { score, ratio } = useReadProgress()
const { best, load: loadScores, openRun } = useLeaderboard()

const nameGlitch = useGlitch()
const roleGlitch = useGlitch()

const COUNTDOWN_SECONDS = 10

/** Índice de secciones. Una sola lista alimenta la nav y el render. */
const STAGES = [
  { id: 'stage-stack',      label: 'Stack' },
  { id: 'stage-proyectos',  label: 'Proyectos' },
  { id: 'stage-experiencia',label: 'Experiencia' },
  { id: 'stage-sobre-mi',   label: 'Sobre mí' },
  { id: 'stage-contacto',   label: 'Contacto' },
]

function handleStart() {
  if (!isIdle.value) return
  // Se reserva la partida en el servidor mientras corre la cuenta
  // atrás: para cuando el jugador dispara, el runId ya está listo.
  openRun()
  nameGlitch.run(glitchScript.nameFrom, glitchScript.nameTo)
  roleGlitch.run(glitchScript.roleFrom, glitchScript.roleTo)
  startSequence(COUNTDOWN_SECONDS)
}

/** Escape aborta la intro y devuelve el CV. Salida siempre visible. */
function onKeydown(e) {
  if (e.key === 'Escape' && phase.value === PHASE.GLITCH) {
    nameGlitch.stop()
    roleGlitch.stop()
    abort()
  }
}

watch(phase, (next) => {
  if (next === PHASE.IDLE) {
    nameGlitch.stop()
    roleGlitch.stop()
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
  <GameCanvas :phase="phase" />

  <!-- Capa 60: el vidrio del monitor -->
  <CrtOverlay :phase="phase" />

  <!-- Capa 40: marcador -->
  <HudBar
    :phase="phase"
    :score="score"
    :hi-score="best"
    :progress="ratio"
  />

  <!-- Capa 10: contenido -->
  <div class="shell">
    <a href="#stage-stack" class="skip">Saltar al contenido</a>

    <main class="u-shell">
      <HeroCard
        :identity="identity"
        :phase="phase"
        :glitch-name="nameGlitch.text.value"
        :glitch-role="roleGlitch.text.value"
        :countdown="countdown"
        @start="handleStart"
      />

      <template v-if="showsCv && !isGlitch">
        <!-- Lo primero que busca un reclutador, sobre el pliegue -->
        <StackStrip :items="primaryStack" />

        <StageNav :stages="STAGES" />

        <StageSection
          id="stage-stack"
          :index="1"
          title="Stack"
          hint="Con qué trabajo y para qué. El nivel es autoevaluación honesta, no marketing."
        >
          <StackGrid :items="stack" />

          <p class="tools">
            <span class="u-label tools__key">También</span>
            <span class="tools__list">{{ toolbelt.join(' · ') }}</span>
          </p>
        </StageSection>

        <StageSection
          id="stage-proyectos"
          :index="2"
          title="Proyectos"
          hint="Qué problema resolvía cada uno y cómo. Filtra por tecnología si buscas algo concreto."
        >
          <ProjectGallery :items="projects" />
        </StageSection>

        <StageSection
          id="stage-experiencia"
          :index="3"
          title="Experiencia"
          hint="Cada puesto con el resultado que dejó, no con la lista de tareas."
        >
          <TimelineList :items="experience" />
        </StageSection>

        <StageSection
          id="stage-sobre-mi"
          :index="4"
          title="Sobre mí"
          hint="Cómo trabajo y qué hago cuando no trabajo."
        >
          <AboutPanel
            :bio="about.bio"
            :hobbies="about.hobbies"
            :principles="about.principles"
          />
        </StageSection>

        <StageSection
          id="stage-contacto"
          :index="5"
          title="Contacto"
          hint="Respondo en menos de 24 h."
        >
          <ContactRow :items="contact" :cv="identity.cv" />
        </StageSection>
      </template>
    </main>

    <footer v-if="showsCv && !isGlitch" class="foot u-shell">
      <p class="foot__line">
        <span class="u-label">Build</span>
        {{ year }} · Vue 3 + Canvas 2D, sin librerías de juego
      </p>
      <p class="foot__hint">Pulsa el avatar para jugar · Escape para volver</p>
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

.tools {
  display: flex;
  flex-wrap: wrap;
  align-items: baseline;
  gap: var(--s-3);
  margin-top: var(--s-6);
  padding-top: var(--s-4);
  border-top: 1px dashed var(--c-line);
}

.tools__key { flex: none; }

.tools__list {
  font-size: var(--t-sm);
  color: var(--c-ink-dim);
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
