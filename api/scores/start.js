/**
 * POST /api/scores/start → abre una partida.
 *
 * Devuelve un runId firmado con HMAC y lo guarda en Redis con TTL.
 * Al enviar la puntuación se hace DEL sobre esa clave: si devuelve 0
 * es que el runId no existía (caducado) o ya se había usado.
 *
 * El coste es una escritura con expiración por partida iniciada, y a
 * cambio se elimina el caso trivial de hacer POST a /api/scores desde
 * la consola sin haber jugado.
 */

import { redis, KEYS, isConfigured } from '../_lib/redis.js'
import { issueRunId, clientIp, applyCors, RUN_TTL_SECONDS } from '../_lib/guard.js'

const START_LIMIT = 30 // partidas abiertas por IP y hora

export default async function handler(req, res) {
  applyCors(res)

  if (req.method === 'OPTIONS') return res.status(204).end()

  if (req.method !== 'POST') {
    res.setHeader('Allow', 'POST, OPTIONS')
    return res.status(405).json({ error: 'Método no permitido' })
  }

  if (!isConfigured || !process.env.LEADERBOARD_SECRET) {
    return res.status(503).json({ error: 'Ranking global no disponible' })
  }

  try {
    const ip = clientIp(req)
    const key = `${KEYS.RATE(ip)}:start`

    const hits = await redis(['INCR', key])
    if (hits === 1) await redis(['EXPIRE', key, 3600])
    if (hits > START_LIMIT) {
      return res.status(429).json({ error: 'Demasiadas partidas. Prueba en un rato.' })
    }

    const runId = issueRunId()
    await redis(['SET', KEYS.RUN(runId), '1', 'EX', RUN_TTL_SECONDS])

    res.setHeader('Cache-Control', 'no-store')
    return res.status(201).json({ runId, issuedAt: Date.now(), ttl: RUN_TTL_SECONDS })
  } catch (err) {
    console.error('[api/scores/start]', err)
    return res.status(500).json({ error: 'Error interno' })
  }
}
