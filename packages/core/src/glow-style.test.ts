import { describe, expect, it } from 'vitest'
import {
  applyGlowLayerLayout,
  applyGlowStyle,
  DEFAULT_GLOW_STYLE,
  glowStyleToCss,
  resolveGlowStyle,
} from './glow-style'

describe('resolveGlowStyle', () => {
  it('fills defaults and clamps invalid values', () => {
    expect(resolveGlowStyle()).toEqual(DEFAULT_GLOW_STYLE)
    expect(resolveGlowStyle({ blur: -5, opacity: 4, saturation: Number.NaN })).toEqual({
      ...DEFAULT_GLOW_STYLE,
      blur: 0,
      opacity: 1,
    })
  })

  it('merges over a base style for partial updates', () => {
    const base = resolveGlowStyle({ blur: 10, opacity: 0.9 })
    expect(resolveGlowStyle({ scale: 2 }, base)).toEqual({ ...base, scale: 2 })
  })
})

describe('glowStyleToCss', () => {
  it('matches the original demo filter chain', () => {
    expect(glowStyleToCss(DEFAULT_GLOW_STYLE)).toEqual({
      filter: 'blur(80px) opacity(0.5) saturate(3)',
      transform: 'scale(1.15) translateZ(0)',
    })
  })

  it('adds brightness only when it differs from 1', () => {
    expect(glowStyleToCss({ ...DEFAULT_GLOW_STYLE, brightness: 1.2 }).filter).toContain(
      'brightness(1.2)'
    )
  })
})

describe('applyGlowStyle and applyGlowLayerLayout', () => {
  it('writes inline styles', () => {
    const el = document.createElement('div')
    applyGlowLayerLayout(el)
    applyGlowStyle(el, DEFAULT_GLOW_STYLE)
    expect(el.style.position).toBe('absolute')
    expect(el.style.pointerEvents).toBe('none')
    expect(el.style.zIndex).toBe('-1')
    expect(el.style.filter).toBe('blur(80px) opacity(0.5) saturate(3)')
    expect(el.style.transform).toBe('scale(1.15) translateZ(0)')
  })
})
