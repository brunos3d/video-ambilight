import { describe, expect, it } from 'vitest'
import { resolveBufferSize } from './buffer-size'

describe('resolveBufferSize', () => {
  it('caps the long edge and keeps the aspect ratio', () => {
    expect(resolveBufferSize({ width: 1920, height: 1080 }, 160)).toEqual({
      width: 160,
      height: 90,
    })
    expect(resolveBufferSize({ width: 1080, height: 1920 }, 160)).toEqual({
      width: 90,
      height: 160,
    })
  })

  it('never upscales small frames', () => {
    expect(resolveBufferSize({ width: 64, height: 48 }, 160)).toEqual({ width: 64, height: 48 })
  })

  it('enforces a minimum edge of 2 px for extreme aspect ratios', () => {
    expect(resolveBufferSize({ width: 4000, height: 10 }, 160)).toEqual({ width: 160, height: 2 })
  })

  it('returns 0x0 for zero, negative or non finite dimensions', () => {
    expect(resolveBufferSize({ width: 0, height: 720 }, 160)).toEqual({ width: 0, height: 0 })
    expect(resolveBufferSize({ width: -1, height: 720 }, 160)).toEqual({ width: 0, height: 0 })
    expect(resolveBufferSize({ width: Number.NaN, height: 720 }, 160)).toEqual({
      width: 0,
      height: 0,
    })
  })

  it('falls back to the default resolution for invalid caps', () => {
    expect(resolveBufferSize({ width: 1920, height: 1080 }, 0)).toEqual({ width: 160, height: 90 })
  })
})
