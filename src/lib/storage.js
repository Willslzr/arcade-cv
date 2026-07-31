/**
 * storage.js — Acceso a localStorage a prueba de fallos.
 *
 * localStorage lanza excepción en modo privado de Safari y cuando
 * se supera la cuota. Un portfolio no puede caerse por eso, así que
 * todo acceso pasa por aquí y degrada en silencio.
 */

const NS = 'arcade-cv:'

function available() {
  try {
    const probe = `${NS}__probe`
    localStorage.setItem(probe, '1')
    localStorage.removeItem(probe)
    return true
  } catch {
    return false
  }
}

const ENABLED = typeof window !== 'undefined' && available()

export const storage = {
  /**
   * @template T
   * @param {string} key
   * @param {T} fallback
   * @returns {T}
   */
  get(key, fallback = null) {
    if (!ENABLED) return fallback
    try {
      const raw = localStorage.getItem(NS + key)
      return raw === null ? fallback : JSON.parse(raw)
    } catch {
      return fallback
    }
  },

  set(key, value) {
    if (!ENABLED) return false
    try {
      localStorage.setItem(NS + key, JSON.stringify(value))
      return true
    } catch {
      return false
    }
  },

  remove(key) {
    if (!ENABLED) return
    try {
      localStorage.removeItem(NS + key)
    } catch {
      /* sin efecto */
    }
  },
}

export const STORAGE_KEYS = Object.freeze({
  SCORES: 'scores',
  INITIALS: 'initials',
  BEST: 'best',
  LOCALE: 'locale',
})
