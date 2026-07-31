/**
 * useLocale.js — idioma del CV (ES/EN) y el contenido ya localizado.
 *
 * Estado a nivel de módulo, igual que usePhase.js: una sola instancia
 * para toda la app, persistida en localStorage para que recargar la
 * página no vuelva a preguntar. El juego no importa nada de aquí a
 * propósito — el alcance es sólo el CV (ver translations.js).
 *
 * Dos cosas que expone:
 *   `t(path, ...args)`   → texto de interfaz por clave con puntos
 *                          ("hero.insertCoin"). Si el valor es una
 *                          función (los que llevan variables, como
 *                          el año del footer), se invoca con `args`.
 *   `identity/stackColumns/experience/projects/about/glitchScript`
 *                        → los mismos datos de profile.js, ya
 *                          fusionados con la traducción del idioma
 *                          activo. `contact` no se traduce (son
 *                          nombres propios y enlaces) y se reexporta
 *                          tal cual para que todo salga de un único
 *                          sitio.
 *
 * La fusión se hace por `id`/`label` estable, nunca por posición: así
 * reordenar `profile.js` no desincroniza una traducción.
 */

import { ref, computed, readonly } from 'vue'
import { storage, STORAGE_KEYS } from '../lib/storage.js'
import {
  identity as baseIdentity,
  stackColumns as baseStackColumns,
  experience as baseExperience,
  projects as baseProjects,
  about as baseAbout,
  contact as baseContact,
} from '../data/profile.js'
import { ui, content, DEFAULT_LOCALE, SUPPORTED_LOCALES } from '../i18n/translations.js'

function readInitialLocale() {
  const saved = storage.get(STORAGE_KEYS.LOCALE, DEFAULT_LOCALE)
  return SUPPORTED_LOCALES.includes(saved) ? saved : DEFAULT_LOCALE
}

const locale = ref(readInitialLocale())

if (typeof document !== 'undefined') {
  document.documentElement.lang = locale.value
}

function setLocale(next) {
  if (!SUPPORTED_LOCALES.includes(next) || next === locale.value) return
  locale.value = next
  storage.set(STORAGE_KEYS.LOCALE, next)
  if (typeof document !== 'undefined') document.documentElement.lang = next
}

function toggleLocale() {
  setLocale(locale.value === 'es' ? 'en' : 'es')
}

/** Lee `ui[locale]` por ruta de puntos; invoca la función si `path` la devuelve. */
function t(path, ...args) {
  const dict = ui[locale.value] ?? ui[DEFAULT_LOCALE]
  const value = path.split('.').reduce((node, key) => node?.[key], dict)
  if (value === undefined) {
    console.warn(`[useLocale] falta la clave "${path}" en "${locale.value}"`)
    return path
  }
  return typeof value === 'function' ? value(...args) : value
}

const localizedIdentity = computed(() => ({
  ...baseIdentity,
  ...content[locale.value].identity,
}))

const localizedGlitchScript = computed(() => {
  const over = content[locale.value].glitchScript
  const analystWord = over.analystWord ?? 'ANALISTA'
  return {
    nameFrom: baseIdentity.name,
    nameTo: over.nameTo ?? 'SISTEMA COMPROMETIDO',
    roleFrom: `LEVEL ${baseIdentity.level} · ${analystWord} & DEV · LARAVEL JS SQL POSTGRES VUE NODE · ${baseIdentity.base.toUpperCase()}`,
    roleTo: over.roleTo ?? 'DESTRUYE A LOS INVASORES. SALVA EL PLANETA.',
  }
})

const localizedStackColumns = computed(() => {
  const overrides = content[locale.value].stackColumns
  return baseStackColumns.map((col) => ({
    ...col,
    items: col.items.map((item) => ({
      ...item,
      note: overrides[col.id]?.[item.label] ?? item.note,
    })),
  }))
})

const localizedExperience = computed(() => {
  const overrides = content[locale.value].experience
  return baseExperience.map((entry) => ({ ...entry, ...overrides[entry.id] }))
})

const localizedProjects = computed(() => {
  const overrides = content[locale.value].projects
  return baseProjects.map((project) => {
    const over = overrides[project.id]
    if (!over) return project
    return {
      ...project,
      ...over,
      // Sólo se traduce la etiqueta del enlace; el href es el mismo
      // recurso en cualquier idioma.
      links: project.links.map((link, i) => ({ ...link, label: over.links?.[i] ?? link.label })),
    }
  })
})

const localizedAbout = computed(() => {
  const over = content[locale.value].about
  return {
    bio: over.bio ?? baseAbout.bio,
    education: { ...baseAbout.education, degree: over.education?.degree ?? baseAbout.education.degree },
    hobbies: baseAbout.hobbies.map((hobby) => ({ ...hobby, ...over.hobbies?.[hobby.id] })),
    principles: over.principles ?? baseAbout.principles,
  }
})

export function useLocale() {
  return {
    locale: readonly(locale),
    setLocale,
    toggleLocale,
    t,

    identity: localizedIdentity,
    stackColumns: localizedStackColumns,
    experience: localizedExperience,
    projects: localizedProjects,
    about: localizedAbout,
    glitchScript: localizedGlitchScript,
    contact: baseContact,
  }
}
