/**
 * guard.js — validación, firma y límite de peticiones.
 *
 * Sobre el anti-trampas: en un juego que corre en el navegador del
 * visitante, la puntuación NO se puede verificar de verdad. Quien
 * quiera falsearla, podrá. El objetivo aquí es más modesto y honesto:
 * que no baste con abrir la consola y hacer un fetch. Se cubren
 * cuatro vectores baratos:
 *
 *   1. Partida firmada  — hay que pedir un runId antes de jugar y
 *      cada runId sólo sirve una vez.
 *   2. Caducidad        — un runId vale 30 minutos.
 *   3. Plausibilidad    — puntuación por segundo por encima de lo
 *      humanamente posible ⇒ rechazo.
 *   4. Límite por IP    — 10 envíos por hora.
 */

import { createHmac, randomUUID, timingSafeEqual } from 'node:crypto'

const SECRET = process.env.LEADERBOARD_SECRET ?? ''

export const RUN_TTL_SECONDS = 60 * 30      // 30 min
export const RATE_LIMIT = 10                 // envíos
export const RATE_WINDOW_SECONDS = 60 * 60   // por hora

export const LIMITS = Object.freeze({
  MAX_SCORE: 250000,        // debe coincidir con SCORING.maxPlausible
  MAX_SCORE_PER_SECOND: 900,
  MIN_DURATION_MS: 5000,
  MAX_DURATION_MS: 1000 * 60 * 30,
  MAX_WAVE: 20,
})

/** Genera un identificador de partida firmado: "<uuid>.<hmac>". */
export function issueRunId() {
  if (!SECRET) throw new Error('Falta LEADERBOARD_SECRET')
  const id = randomUUID()
  const sig = createHmac('sha256', SECRET).update(id).digest('hex').slice(0, 32)
  return `${id}.${sig}`
}

/** Comprueba la firma en tiempo constante. */
export function verifyRunId(runId) {
  if (!SECRET || typeof runId !== 'string') return false
  const [id, sig] = runId.split('.')
  if (!id || !sig) return false

  const expected = createHmac('sha256', SECRET).update(id).digest('hex').slice(0, 32)
  const a = Buffer.from(sig)
  const b = Buffer.from(expected)
  return a.length === b.length && timingSafeEqual(a, b)
}

/** Sólo A-Z, exactamente 3. Es una máquina recreativa. */
export function normalizeInitials(raw) {
  const clean = String(raw ?? '').toUpperCase().replace(/[^A-Z]/g, '').slice(0, 3)
  return clean.length === 3 ? clean : null
}

/**
 * Valida el cuerpo del POST.
 * @returns {{ ok: true, value: object } | { ok: false, error: string }}
 */
export function validateSubmission(body) {
  if (!body || typeof body !== 'object') {
    return { ok: false, error: 'Cuerpo inválido' }
  }

  const initials = normalizeInitials(body.initials)
  if (!initials) return { ok: false, error: 'Las iniciales deben ser 3 letras (A–Z)' }

  const score = Number(body.score)
  if (!Number.isInteger(score) || score < 0 || score > LIMITS.MAX_SCORE) {
    return { ok: false, error: 'Puntuación fuera de rango' }
  }

  const wave = Number(body.wave)
  if (!Number.isInteger(wave) || wave < 0 || wave > LIMITS.MAX_WAVE) {
    return { ok: false, error: 'Oleada fuera de rango' }
  }

  const durationMs = Number(body.durationMs)
  if (
    !Number.isFinite(durationMs) ||
    durationMs < LIMITS.MIN_DURATION_MS ||
    durationMs > LIMITS.MAX_DURATION_MS
  ) {
    return { ok: false, error: 'Duración de partida no plausible' }
  }

  const perSecond = score / (durationMs / 1000)
  if (perSecond > LIMITS.MAX_SCORE_PER_SECOND) {
    return { ok: false, error: 'Ritmo de puntuación no plausible' }
  }

  return { ok: true, value: { initials, score, wave, durationMs } }
}

/** IP del cliente detrás del proxy de Vercel. */
export function clientIp(req) {
  const fwd = req.headers['x-forwarded-for']
  if (typeof fwd === 'string') return fwd.split(',')[0].trim()
  return req.socket?.remoteAddress ?? 'unknown'
}

/** Cabeceras CORS: sólo se sirve desde el propio dominio. */
export function applyCors(res, origin = process.env.PUBLIC_ORIGIN ?? '') {
  if (origin) res.setHeader('Access-Control-Allow-Origin', origin)
  res.setHeader('Access-Control-Allow-Methods', 'GET,POST,OPTIONS')
  res.setHeader('Access-Control-Allow-Headers', 'content-type')
}
