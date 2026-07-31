/**
 * GET  /api/scores  → top 20 del ranking global
 * POST /api/scores  → registrar una puntuación (requiere runId)
 *
 * Estructura en Redis: un único sorted set `lb:scores`.
 *   miembro = JSON con { initials, wave, at, nonce }
 *   score   = puntos
 * El nonce hace único cada miembro; sin él, dos jugadores con las
 * mismas iniciales y puntos colisionarían y se perdería una entrada.
 */

import { redis, pipeline, KEYS, isConfigured } from '../_lib/redis.js'
import {
  validateSubmission,
  verifyRunId,
  clientIp,
  applyCors,
  RATE_LIMIT,
  RATE_WINDOW_SECONDS,
} from '../_lib/guard.js'

const TOP = 20
const BOARD_MAX = 200 // se conservan 200 y se recorta: histórico sin crecer sin fin

export default async function handler(req, res) {
  applyCors(res)

  if (req.method === 'OPTIONS') return res.status(204).end()

  if (!isConfigured) {
    // Sin backend configurado el frontend cae a localStorage. Se
    // responde 503 explícito en vez de un 500 confuso.
    return res.status(503).json({ error: 'Ranking global no disponible' })
  }

  try {
    if (req.method === 'GET') return await getBoard(res)
    if (req.method === 'POST') return await postScore(req, res)
    res.setHeader('Allow', 'GET, POST, OPTIONS')
    return res.status(405).json({ error: 'Método no permitido' })
  } catch (err) {
    console.error('[api/scores]', err)
    return res.status(500).json({ error: 'Error interno' })
  }
}

/* ------------------------------------------------------------ */

async function getBoard(res) {
  const raw = await redis(['ZREVRANGE', KEYS.BOARD, 0, TOP - 1, 'WITHSCORES'])

  const entries = []
  for (let i = 0; i < raw.length; i += 2) {
    try {
      const meta = JSON.parse(raw[i])
      entries.push({
        initials: meta.initials,
        wave: meta.wave,
        at: meta.at,
        score: Number(raw[i + 1]),
      })
    } catch {
      // Una entrada corrupta no debe tumbar la tabla entera.
    }
  }

  // Cacheable en el CDN 30 s; se sirve el cacheado hasta 5 min
  // mientras se revalida por detrás. Un ranking no necesita ser
  // instantáneo y así se evita golpear Redis en cada visita.
  res.setHeader('Cache-Control', 's-maxage=30, stale-while-revalidate=300')
  return res.status(200).json({ entries })
}

async function postScore(req, res) {
  const { runId } = req.body ?? {}

  if (!verifyRunId(runId)) {
    return res.status(401).json({ error: 'Partida no válida' })
  }

  const check = validateSubmission(req.body)
  if (!check.ok) {
    return res.status(422).json({ error: check.error })
  }

  const ip = clientIp(req)

  // Límite por IP y consumo del runId en una sola ida y vuelta.
  // DEL devuelve 1 sólo si el runId existía: eso lo hace de un
  // único uso y cierra el replay de una misma partida.
  const [hits, consumed] = await pipeline([
    ['INCR', KEYS.RATE(ip)],
    ['DEL', KEYS.RUN(runId)],
  ])

  if (hits === 1) {
    await redis(['EXPIRE', KEYS.RATE(ip), RATE_WINDOW_SECONDS])
  }

  if (hits > RATE_LIMIT) {
    return res.status(429).json({ error: 'Demasiados envíos. Prueba en un rato.' })
  }

  if (consumed !== 1) {
    return res.status(409).json({ error: 'Esta partida ya fue registrada o ha caducado' })
  }

  const { initials, score, wave } = check.value
  const member = JSON.stringify({
    initials,
    wave,
    at: Date.now(),
    nonce: runId.slice(0, 8),
  })

  await pipeline([
    ['ZADD', KEYS.BOARD, score, member],
    // Recorte: se queda con los BOARD_MAX mejores.
    ['ZREMRANGEBYRANK', KEYS.BOARD, 0, -(BOARD_MAX + 1)],
  ])

  const rank = await redis(['ZREVRANK', KEYS.BOARD, member])

  return res.status(201).json({
    ok: true,
    rank: typeof rank === 'number' ? rank + 1 : null,
  })
}
