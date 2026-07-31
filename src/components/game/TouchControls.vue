<script setup>
/**
 * TouchControls — joystick y disparo táctiles.
 *
 * Sin esto el juego no existe en móvil, y la mitad de quien abra el
 * enlace lo hará desde el teléfono. Detecta soporte con
 * `(pointer: coarse)`, no por ancho de pantalla: hay tablets anchas
 * con pantalla táctil y portátiles estrechos sin ella.
 *
 * No sabe nada de `InputHandler` ni de `Engine`: sólo emite `move`
 * ({x, y} normalizados a -1..1) y `fire` (booleano). Quien la monta
 * decide qué hacer con esos números — así, el día que cambie el
 * motor, este componente no se entera.
 *
 * El stick sólo aparece donde se toca, no ocupa pantalla de forma
 * permanente: nace invisible y dibuja su base en el punto exacto del
 * primer contacto.
 */
import { ref, computed, onMounted, onBeforeUnmount } from 'vue'

const props = defineProps({
  /** Sólo tiene sentido escuchar toques durante la partida. */
  active: { type: Boolean, default: false },
})

const emit = defineEmits(['move', 'fire'])

const RADIUS = 56    // px — tope de desplazamiento del stick
const DEADZONE = 8   // px — por debajo de esto, el eje se reporta en 0

const supportsTouch = ref(false)
let mql = null

function onMqlChange(e) {
  supportsTouch.value = e.matches
}

onMounted(() => {
  mql = window.matchMedia('(pointer: coarse)')
  supportsTouch.value = mql.matches
  mql.addEventListener('change', onMqlChange)
})

onBeforeUnmount(() => {
  mql?.removeEventListener('change', onMqlChange)
  // Si el componente desaparece a media maniobra (fin de partida),
  // que no se quede un eje o un disparo pegado en InputHandler.
  emit('move', { x: 0, y: 0 })
  emit('fire', false)
})

function findTouch(list, id) {
  for (const t of list) {
    if (t.identifier === id) return t
  }
  return null
}

/* --- Stick de movimiento (zona izquierda) --------------------- */
const stickId = ref(null)
const stickOrigin = ref({ x: 0, y: 0 })
const stickOffset = ref({ x: 0, y: 0 }) // desplazamiento visual del knob, en px

const stickVisible = computed(() => stickId.value !== null)

function onStickStart(e) {
  if (stickId.value !== null) return
  const t = e.changedTouches[0]
  stickId.value = t.identifier
  stickOrigin.value = { x: t.clientX, y: t.clientY }
  stickOffset.value = { x: 0, y: 0 }
}

function onStickMove(e) {
  const t = findTouch(e.changedTouches, stickId.value)
  if (!t) return

  const dx = t.clientX - stickOrigin.value.x
  const dy = t.clientY - stickOrigin.value.y
  const dist = Math.min(Math.hypot(dx, dy), RADIUS)
  const angle = Math.atan2(dy, dx)

  stickOffset.value = { x: Math.cos(angle) * dist, y: Math.sin(angle) * dist }

  if (dist < DEADZONE) {
    emit('move', { x: 0, y: 0 })
    return
  }
  emit('move', { x: (Math.cos(angle) * dist) / RADIUS, y: (Math.sin(angle) * dist) / RADIUS })
}

function onStickEnd(e) {
  if (!findTouch(e.changedTouches, stickId.value)) return
  stickId.value = null
  stickOffset.value = { x: 0, y: 0 }
  emit('move', { x: 0, y: 0 })
}

/* --- Disparo (zona derecha) ------------------------------------
   Automático mientras se mantiene el dedo: es lo estándar en
   shooters táctiles, y con cooldown propio del arma no hace falta
   que quien dispara acierte el ritmo con el pulgar.               */
const fireId = ref(null)
const firing = computed(() => fireId.value !== null)

function onFireStart(e) {
  if (fireId.value !== null) return
  fireId.value = e.changedTouches[0].identifier
  emit('fire', true)
}

function onFireEnd(e) {
  if (!findTouch(e.changedTouches, fireId.value)) return
  fireId.value = null
  emit('fire', false)
}
</script>

<template>
  <div v-if="supportsTouch && active" class="touch" aria-hidden="true">
    <div
      class="touch__zone touch__zone--move"
      @touchstart.prevent="onStickStart"
      @touchmove.prevent="onStickMove"
      @touchend.prevent="onStickEnd"
      @touchcancel.prevent="onStickEnd"
    >
      <div
        v-if="stickVisible"
        class="touch__stick"
        :style="{ left: stickOrigin.x + 'px', top: stickOrigin.y + 'px' }"
      >
        <div class="touch__base"></div>
        <div
          class="touch__knob"
          :style="{ transform: `translate(${stickOffset.x}px, ${stickOffset.y}px)` }"
        ></div>
      </div>
    </div>

    <div
      class="touch__zone touch__zone--fire"
      @touchstart.prevent="onFireStart"
      @touchend.prevent="onFireEnd"
      @touchcancel.prevent="onFireEnd"
    >
      <div class="touch__fire-btn" :class="{ 'is-active': firing }">
        <span class="touch__fire-mark">+</span>
      </div>
    </div>
  </div>
</template>

<style scoped>
/* Cubre toda la pantalla en dos mitades; cada mitad es su propia
   zona de toque. touch-action: none evita que el navegador intente
   hacer scroll o zoom con estos gestos. */
.touch {
  position: fixed;
  inset: 0;
  z-index: var(--z-hud);
  display: flex;
  touch-action: none;
}

.touch__zone {
  flex: 1 1 50%;
  position: relative;
}

.touch__zone--fire {
  display: flex;
  align-items: flex-end;
  justify-content: flex-end;
  padding: var(--s-7);
}

/* El stick nace en el punto exacto del toque, no en una posición fija:
   nada visible hasta que el pulgar aparece. */
.touch__stick {
  position: fixed;
  width: 0;
  height: 0;
  pointer-events: none;
}

.touch__base {
  position: absolute;
  left: -56px;
  top: -56px;
  width: 112px;
  height: 112px;
  border: 1px solid var(--c-line);
}

.touch__knob {
  position: absolute;
  left: -32px;
  top: -32px;
  width: 64px;
  height: 64px;
  background: rgba(56, 237, 172, 0.15);
  border: 2px solid var(--c-phosphor);
  box-shadow: var(--glow-phosphor);
}

.touch__fire-btn {
  width: 72px;
  height: 72px;
  display: grid;
  place-items: center;
  background: rgba(255, 61, 113, 0.1);
  border: 2px solid var(--c-magenta);
  box-shadow: var(--shadow-hard);
  transition: background var(--d-fast) var(--ease-crt),
              box-shadow var(--d-fast) var(--ease-crt),
              transform var(--d-fast) var(--ease-crt);
}

.touch__fire-mark {
  font-family: var(--f-display);
  font-size: 1.75rem;
  line-height: 1;
  color: var(--c-magenta);
}

.touch__fire-btn.is-active {
  background: var(--c-magenta);
  box-shadow: none;
  transform: translate(2px, 2px);
}

.touch__fire-btn.is-active .touch__fire-mark {
  color: var(--c-void);
}
</style>
