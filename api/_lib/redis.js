/**
 * redis.js — cliente Upstash vía REST.
 *
 * Por qué Upstash y no una base de datos "de verdad": un ranking es
 * literalmente un sorted set. ZADD para insertar, ZREVRANGE para
 * leer el top 20. No hay entidades, ni relaciones, ni migraciones,
 * así que un ORM y Postgres serían infraestructura sin trabajo.
 *
 * Por qué la API REST y no el SDK con conexión TCP: las funciones
 * serverless son efímeras y no pueden mantener un pool de conexiones.
 * REST sobre HTTP encaja con el modelo de ejecución.
 *
 * Variables de entorno (Vercel → Settings → Environment Variables):
 *   UPSTASH_REDIS_REST_URL
 *   UPSTASH_REDIS_REST_TOKEN
 */

const URL = process.env.UPSTASH_REDIS_REST_URL
const TOKEN = process.env.UPSTASH_REDIS_REST_TOKEN

export const isConfigured = Boolean(URL && TOKEN)

/**
 * Ejecuta un comando Redis. `command` es un array al estilo CLI:
 *   redis(['ZADD', 'scores', '1200', 'WLM'])
 * @param {(string|number)[]} command
 */
export async function redis(command) {
  if (!isConfigured) {
    throw new Error('Upstash no está configurado: faltan variables de entorno')
  }

  const res = await fetch(URL, {
    method: 'POST',
    headers: {
      authorization: `Bearer ${TOKEN}`,
      'content-type': 'application/json',
    },
    body: JSON.stringify(command),
  })

  if (!res.ok) {
    throw new Error(`Upstash respondió ${res.status}`)
  }

  const data = await res.json()
  if (data.error) throw new Error(data.error)
  return data.result
}

/** Varios comandos en una sola ida y vuelta. */
export async function pipeline(commands) {
  if (!isConfigured) {
    throw new Error('Upstash no está configurado: faltan variables de entorno')
  }

  const res = await fetch(`${URL}/pipeline`, {
    method: 'POST',
    headers: {
      authorization: `Bearer ${TOKEN}`,
      'content-type': 'application/json',
    },
    body: JSON.stringify(commands),
  })

  if (!res.ok) throw new Error(`Upstash respondió ${res.status}`)
  return (await res.json()).map((r) => r.result)
}

export const KEYS = Object.freeze({
  BOARD: 'lb:scores',           // sorted set: miembro = entrada JSON, score = puntos
  RUN: (id) => `lb:run:${id}`,  // string con TTL: partida abierta pendiente de cerrar
  RATE: (ip) => `lb:rate:${ip}`,// contador con TTL para el límite por IP
})
