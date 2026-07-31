import { describe, it, expect, vi, beforeAll } from 'vitest'

// SECRET se lee de process.env al cargar el módulo (una sola vez), así
// que hay que fijar la variable ANTES del primer import "normal" que
// use el resto de la suite. Los tests que necesitan un SECRET distinto
// (o ausente) importan su propia copia fresca con un sufijo de query
// para forzar una nueva evaluación del módulo.
let guard

beforeAll(async () => {
  process.env.LEADERBOARD_SECRET = 'test-secret-no-usar-en-real'
  guard = await import('./guard.js')
})

describe('issueRunId / verifyRunId', () => {
  it('un runId recién emitido verifica correctamente', () => {
    const runId = guard.issueRunId()
    expect(runId).toMatch(/^[0-9a-f-]{36}\.[0-9a-f]{32}$/)
    expect(guard.verifyRunId(runId)).toBe(true)
  })

  it('rechaza la firma si se manipula un carácter de la firma', () => {
    const runId = guard.issueRunId()
    const [id, sig] = runId.split('.')
    const tamperedSig = sig[0] === 'a' ? 'b' + sig.slice(1) : 'a' + sig.slice(1)
    expect(guard.verifyRunId(`${id}.${tamperedSig}`)).toBe(false)
  })

  it('rechaza si se cambia el id pero se conserva la firma original', () => {
    const runId = guard.issueRunId()
    const [, sig] = runId.split('.')
    expect(guard.verifyRunId(`00000000-0000-0000-0000-000000000000.${sig}`)).toBe(false)
  })

  it('rechaza entradas mal formadas sin lanzar', () => {
    expect(guard.verifyRunId('sin-punto')).toBe(false)
    expect(guard.verifyRunId('')).toBe(false)
    expect(guard.verifyRunId(null)).toBe(false)
    expect(guard.verifyRunId(undefined)).toBe(false)
    expect(guard.verifyRunId(12345)).toBe(false)
    expect(guard.verifyRunId('solo-id-sin-firma.')).toBe(false)
  })

  it('sin LEADERBOARD_SECRET, issueRunId lanza y verifyRunId rechaza sin lanzar', async () => {
    const original = process.env.LEADERBOARD_SECRET
    delete process.env.LEADERBOARD_SECRET
    vi.resetModules()
    const noSecretGuard = await import('./guard.js?no-secret-' + Date.now())

    expect(() => noSecretGuard.issueRunId()).toThrow()
    expect(noSecretGuard.verifyRunId('cualquier.cosa')).toBe(false)

    process.env.LEADERBOARD_SECRET = original
  })
})

describe('normalizeInitials', () => {
  it('pasa a mayúsculas', () => {
    expect(guard.normalizeInitials('abc')).toBe('ABC')
  })

  it('quita cualquier carácter que no sea A-Z', () => {
    expect(guard.normalizeInitials('a1 b2!c')).toBe('ABC')
  })

  it('trunca a 3 en vez de rechazar cuando sobran letras', () => {
    // Es una máquina recreativa: 3 letras, siempre. Un input más largo
    // no es un error, se recorta.
    expect(guard.normalizeInitials('abcdef')).toBe('ABC')
  })

  it('rechaza (null) si quedan menos de 3 letras tras limpiar', () => {
    expect(guard.normalizeInitials('ab')).toBeNull()
    expect(guard.normalizeInitials('a1')).toBeNull()
    expect(guard.normalizeInitials('123')).toBeNull()
    expect(guard.normalizeInitials('')).toBeNull()
  })

  it('no lanza con null, undefined o números', () => {
    expect(guard.normalizeInitials(null)).toBeNull()
    expect(guard.normalizeInitials(undefined)).toBeNull()
    expect(guard.normalizeInitials(123)).toBeNull()
  })
})

describe('validateSubmission', () => {
  const validBody = () => ({ initials: 'wlm', score: 12345, wave: 4, durationMs: 65000 })

  it('acepta una partida plausible y normaliza los datos', () => {
    const result = guard.validateSubmission(validBody())
    expect(result).toEqual({
      ok: true,
      value: { initials: 'WLM', score: 12345, wave: 4, durationMs: 65000 },
    })
  })

  it('rechaza cuerpos que no son objetos', () => {
    expect(guard.validateSubmission(null).ok).toBe(false)
    expect(guard.validateSubmission(undefined).ok).toBe(false)
    expect(guard.validateSubmission('string').ok).toBe(false)
    expect(guard.validateSubmission(42).ok).toBe(false)
  })

  it('rechaza iniciales inválidas', () => {
    const result = guard.validateSubmission({ ...validBody(), initials: 'ab' })
    expect(result.ok).toBe(false)
  })

  it('rechaza puntuación no entera, negativa o por encima del límite', () => {
    expect(guard.validateSubmission({ ...validBody(), score: 1.5 }).ok).toBe(false)
    expect(guard.validateSubmission({ ...validBody(), score: -1 }).ok).toBe(false)
    expect(guard.validateSubmission({ ...validBody(), score: guard.LIMITS.MAX_SCORE + 1 }).ok).toBe(false)
  })

  it('acepta la puntuación exactamente en el techo, si el ritmo sigue siendo plausible', () => {
    // Al máximo techo hace falta una partida larga para no disparar el
    // límite de puntos/segundo — si no, este caso concreto no prueba
    // el límite de score, prueba el de ritmo.
    const durationMs = (guard.LIMITS.MAX_SCORE / guard.LIMITS.MAX_SCORE_PER_SECOND) * 1000 + 1000
    const result = guard.validateSubmission({
      ...validBody(),
      score: guard.LIMITS.MAX_SCORE,
      durationMs,
    })
    expect(result.ok).toBe(true)
  })

  it('rechaza oleada no entera, negativa o por encima del límite', () => {
    expect(guard.validateSubmission({ ...validBody(), wave: 1.5 }).ok).toBe(false)
    expect(guard.validateSubmission({ ...validBody(), wave: -1 }).ok).toBe(false)
    expect(guard.validateSubmission({ ...validBody(), wave: guard.LIMITS.MAX_WAVE + 1 }).ok).toBe(false)
  })

  it('rechaza duraciones no plausibles: demasiado corta, demasiado larga o no finita', () => {
    expect(guard.validateSubmission({ ...validBody(), durationMs: guard.LIMITS.MIN_DURATION_MS - 1 }).ok).toBe(false)
    expect(guard.validateSubmission({ ...validBody(), durationMs: guard.LIMITS.MAX_DURATION_MS + 1 }).ok).toBe(false)
    expect(guard.validateSubmission({ ...validBody(), durationMs: Infinity }).ok).toBe(false)
    expect(guard.validateSubmission({ ...validBody(), durationMs: NaN }).ok).toBe(false)
  })

  it('rechaza un ritmo de puntos por segundo humanamente imposible', () => {
    // Puntuación y duración individualmente válidas, pero juntas
    // implican más de MAX_SCORE_PER_SECOND.
    const result = guard.validateSubmission({
      ...validBody(),
      score: 100000,
      durationMs: guard.LIMITS.MIN_DURATION_MS, // 5s -> 20000 pts/s
    })
    expect(result.ok).toBe(false)
  })
})

describe('clientIp', () => {
  it('usa la primera IP de x-forwarded-for', () => {
    const req = { headers: { 'x-forwarded-for': '203.0.113.9, 10.0.0.1' }, socket: {} }
    expect(guard.clientIp(req)).toBe('203.0.113.9')
  })

  it('recorta espacios alrededor de la IP', () => {
    const req = { headers: { 'x-forwarded-for': '  203.0.113.9  ,10.0.0.1' }, socket: {} }
    expect(guard.clientIp(req)).toBe('203.0.113.9')
  })

  it('cae a socket.remoteAddress sin la cabecera', () => {
    const req = { headers: {}, socket: { remoteAddress: '198.51.100.4' } }
    expect(guard.clientIp(req)).toBe('198.51.100.4')
  })

  it('devuelve "unknown" si no hay ni cabecera ni socket', () => {
    const req = { headers: {}, socket: {} }
    expect(guard.clientIp(req)).toBe('unknown')
  })
})

describe('applyCors', () => {
  it('fija el origen cuando se pasa uno', () => {
    const res = { setHeader: vi.fn() }
    guard.applyCors(res, 'https://williamsalazar.dev')
    expect(res.setHeader).toHaveBeenCalledWith('Access-Control-Allow-Origin', 'https://williamsalazar.dev')
    expect(res.setHeader).toHaveBeenCalledWith('Access-Control-Allow-Methods', 'GET,POST,OPTIONS')
    expect(res.setHeader).toHaveBeenCalledWith('Access-Control-Allow-Headers', 'content-type')
  })

  it('no fija Allow-Origin si no hay origen configurado', () => {
    const res = { setHeader: vi.fn() }
    guard.applyCors(res, '')
    expect(res.setHeader).not.toHaveBeenCalledWith('Access-Control-Allow-Origin', expect.anything())
    // las otras dos cabeceras se fijan igual
    expect(res.setHeader).toHaveBeenCalledWith('Access-Control-Allow-Methods', 'GET,POST,OPTIONS')
  })
})
