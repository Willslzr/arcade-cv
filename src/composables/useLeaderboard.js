/**
 * useLeaderboard.js — Ranking global con degradación local.
 *
 * Contrato con el backend (ver api/scores/*):
 *   GET  /api/scores          → { entries: [{ initials, score, wave, at }] }
 *   POST /api/scores/start    → { runId, issuedAt }
 *   POST /api/scores          → { ok, rank } | { error }
 *
 * Regla de diseño: la red nunca bloquea la experiencia. Si la API
 * falla, el marcador local sigue funcionando y se marca `offline`
 * para que la UI lo diga en vez de mentir con una lista vacía.
 */

import { ref, computed } from 'vue'
import { storage, STORAGE_KEYS } from '../lib/storage.js'

const MAX_ENTRIES = 20
const API = '/api/scores'

const entries = ref([])
const status = ref('idle') // idle | loading | ready | offline
const runId = ref(null)

function readLocal() {
  return storage.get(STORAGE_KEYS.SCORES, [])
}

function writeLocal(list) {
  storage.set(STORAGE_KEYS.SCORES, list.slice(0, MAX_ENTRIES))
}

function sortAndTrim(list) {
  return [...list]
    .sort((a, b) => b.score - a.score || a.at - b.at)
    .slice(0, MAX_ENTRIES)
}

/** Carga el ranking global; cae al local si la API no responde. */
async function load() {
  status.value = 'loading'
  try {
    const res = await fetch(API, { headers: { accept: 'application/json' } })
    if (!res.ok) throw new Error(`HTTP ${res.status}`)
    const data = await res.json()
    entries.value = sortAndTrim(data.entries ?? [])
    status.value = 'ready'
  } catch {
    entries.value = sortAndTrim(readLocal())
    status.value = 'offline'
  }
}

/**
 * Abre una partida en el servidor. El `runId` que devuelve viaja
 * firmado y con caducidad: sin él, el POST de puntuación se
 * rechaza. Es la base del anti-trampas (ver PROJECT.md).
 */
async function openRun() {
  runId.value = null
  try {
    const res = await fetch(`${API}/start`, { method: 'POST' })
    if (!res.ok) return
    const data = await res.json()
    runId.value = data.runId ?? null
  } catch {
    /* sin runId sólo se guardará en local */
  }
}

/**
 * Envía la puntuación. Siempre persiste en local primero para que
 * el jugador vea su marca aunque la red falle.
 * @param {{ initials: string, score: number, wave: number, durationMs: number }} run
 */
async function submit(run) {
  const entry = {
    initials: run.initials.toUpperCase().slice(0, 3),
    score: Math.floor(run.score),
    wave: run.wave,
    at: Date.now(),
  }

  writeLocal(sortAndTrim([...readLocal(), entry]))
  storage.set(STORAGE_KEYS.INITIALS, entry.initials)

  if (!runId.value) {
    entries.value = sortAndTrim([...entries.value, entry])
    status.value = 'offline'
    return { ok: false, reason: 'no-run' }
  }

  try {
    const res = await fetch(API, {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ ...entry, runId: runId.value, durationMs: run.durationMs }),
    })
    const data = await res.json()
    if (!res.ok) throw new Error(data.error ?? 'rejected')
    await load()
    return { ok: true, rank: data.rank }
  } catch (err) {
    entries.value = sortAndTrim([...entries.value, entry])
    status.value = 'offline'
    return { ok: false, reason: String(err.message ?? err) }
  } finally {
    runId.value = null
  }
}

export function useLeaderboard() {
  return {
    entries: computed(() => entries.value),
    status: computed(() => status.value),
    best: computed(() => entries.value[0]?.score ?? 0),
    load,
    openRun,
    submit,
  }
}
