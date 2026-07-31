import { describe, it, expect, vi, afterEach } from 'vitest'
import { GlitchEffect } from './GlitchEffect.js'

describe('GlitchEffect', () => {
  afterEach(() => {
    vi.restoreAllMocks()
  })

  it('fija el ancho en max(from, to) + margen a cada lado', () => {
    const fx = new GlitchEffect('AB', 'XYZ', { margin: 6 })
    expect(fx.width).toBe('XYZ'.length + 6 * 2)
  })

  it('centra el texto de origen en ese ancho, con espacios de relleno', () => {
    const fx = new GlitchEffect('AB', 'XYZ', { margin: 3 })
    // width = 3 + 3*2 = 9; 'AB' (2) -> 3 a la izquierda, 4 a la derecha
    expect(fx.startStr).toBe('   AB    ')
  })

  it('en t=0 muestra el texto de origen tal cual, sin ruido todavía', () => {
    // scrambleAt = Math.random() * scrambleWindow; con random=0.9 nunca es 0,
    // así que elapsedMs=0 siempre cae en la rama "antes de corromperse".
    vi.spyOn(Math, 'random').mockReturnValue(0.9)
    const fx = new GlitchEffect('AB', 'XYZ')
    expect(fx.frameAt(0)).toBe(fx.startStr)
  })

  it('cada fotograma mide siempre el ancho fijo, en cualquier instante', () => {
    const fx = new GlitchEffect('AB', 'A much longer destination string')
    for (const t of [0, 500, 1500, 3000, 10000]) {
      expect(fx.frameAt(t)).toHaveLength(fx.width)
    }
  })

  it('tras el barrido completo, el resultado es el texto de destino centrado', () => {
    // scrambleWindow pequeño: para el instante "settleEnd" todas las
    // posiciones deben haber empezado a corromperse Y haberse resuelto ya,
    // si no el resultado depende de qué tocó en Math.random() y el test
    // sería inestable.
    const fx = new GlitchEffect('AB', 'XYZ', { scrambleWindow: 10, settleStart: 100, settleSpread: 200 })
    expect(fx.frameAt(fx.settleEnd)).toBe('      XYZ      ')
  })

  it('resuelve de izquierda a derecha: las primeras posiciones llegan antes que las últimas', () => {
    // scrambleAt=0 en todas las posiciones (empiezan a corromperse ya);
    // así el único motivo para no ver la letra destino es no haber
    // llegado todavía a su resolveAt.
    vi.spyOn(Math, 'random').mockReturnValue(0)
    // margin:0 y from/to de igual longitud -> sin relleno, sin ambigüedad.
    const fx = new GlitchEffect('AAAA', 'BBBB', { margin: 0, settleStart: 0, settleSpread: 1000 })
    // resolveAt(i) = i/4 * 1000 = 0, 250, 500, 750

    const early = fx.frameAt(300) // posiciones 0 y 1 ya resueltas; 2 y 3 no
    expect(early[0]).toBe('B')
    expect(early[1]).toBe('B')
    expect(early[2]).not.toBe('B')
    expect(early[3]).not.toBe('B')

    const later = fx.frameAt(600) // además la posición 2 ya se resolvió
    expect(later[2]).toBe('B')
    expect(later[3]).not.toBe('B')
  })

  it('isSettled es falso justo antes del final del barrido y verdadero en ese instante', () => {
    const fx = new GlitchEffect('AB', 'XYZ', { settleStart: 100, settleSpread: 200 })
    expect(fx.isSettled(fx.settleEnd - 1)).toBe(false)
    expect(fx.isSettled(fx.settleEnd)).toBe(true)
  })

  it('funciona igual cuando "to" es más largo que "from" (nombre -> rol, por ejemplo)', () => {
    const fx = new GlitchEffect('WILLIAM', 'ANALISTA DE REQUERIMIENTOS')
    expect(fx.width).toBe('ANALISTA DE REQUERIMIENTOS'.length + 12)
    expect(fx.frameAt(fx.settleEnd).trim()).toBe('ANALISTA DE REQUERIMIENTOS')
  })
})
