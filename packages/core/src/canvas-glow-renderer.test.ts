import { describe, expect, it, vi } from 'vitest'
import { createCanvasGlowRenderer, GLOW_DATA_ATTRIBUTE } from './canvas-glow-renderer'
import { DEFAULT_GLOW_STYLE } from './glow-style'
import { createFakeFrame } from './test-utils/fakes'

interface RecordingContext {
  calls: { method: string; args: unknown[] }[]
}

function contextOf(canvas: HTMLCanvasElement): RecordingContext {
  return canvas.getContext('2d') as unknown as RecordingContext
}

describe('createCanvasGlowRenderer', () => {
  it('never asks for a desynchronized context, which would bypass the compositor blur', () => {
    const canvas = document.createElement('canvas')
    const spy = vi.spyOn(canvas, 'getContext')
    createCanvasGlowRenderer({ canvas })
    expect(spy).toHaveBeenCalledWith('2d', { alpha: true })
  })

  it('creates a marked, non interactive canvas with the default glow style', () => {
    const renderer = createCanvasGlowRenderer()
    const canvas = renderer.element as HTMLCanvasElement
    expect(canvas.tagName).toBe('CANVAS')
    expect(canvas.getAttribute(GLOW_DATA_ATTRIBUTE)).toBe('glow')
    expect(canvas.getAttribute('aria-hidden')).toBe('true')
    expect(canvas.style.pointerEvents).toBe('none')
    expect(canvas.style.filter).toBe('blur(80px) opacity(0.5) saturate(3)')
  })

  it('sizes the backing store from the frame and the resolution, then draws', () => {
    const renderer = createCanvasGlowRenderer()
    const canvas = renderer.element as HTMLCanvasElement
    renderer.setResolution(120)
    renderer.render(createFakeFrame(1920, 1080))
    expect(renderer.getBufferSize()).toEqual({ width: 120, height: 68 })
    expect(canvas.width).toBe(120)
    expect(canvas.height).toBe(68)
    const calls = contextOf(canvas).calls
    expect(calls.at(-1)?.method).toBe('drawImage')
    expect(calls.at(-1)?.args.slice(1)).toEqual([0, 0, 120, 68])
  })

  it('only resizes when the frame aspect changes', () => {
    const renderer = createCanvasGlowRenderer()
    const canvas = renderer.element as HTMLCanvasElement
    renderer.render(createFakeFrame(1280, 720))
    const first = { width: canvas.width, height: canvas.height }
    renderer.render(createFakeFrame(1920, 1080))
    expect({ width: canvas.width, height: canvas.height }).toEqual(first)
    renderer.render(createFakeFrame(1080, 1920))
    expect(canvas.width).toBe(90)
    expect(canvas.height).toBe(160)
  })

  it('skips degenerate frames and clears the buffer on demand', () => {
    const renderer = createCanvasGlowRenderer()
    const canvas = renderer.element as HTMLCanvasElement
    renderer.render(createFakeFrame(0, 0))
    expect(contextOf(canvas).calls).toHaveLength(0)
    renderer.render(createFakeFrame(640, 360))
    renderer.clear()
    expect(contextOf(canvas).calls.at(-1)?.method).toBe('clearRect')
  })

  it('reuses a provided canvas and removes it on dispose', () => {
    const canvas = document.createElement('canvas')
    document.body.appendChild(canvas)
    const renderer = createCanvasGlowRenderer({ canvas, className: 'glow' })
    expect(renderer.element).toBe(canvas)
    expect(canvas.classList.contains('glow')).toBe(true)
    renderer.setStyle({ ...DEFAULT_GLOW_STYLE, blur: 20 })
    expect(canvas.style.filter).toContain('blur(20px)')
    renderer.dispose()
    expect(canvas.isConnected).toBe(false)
    renderer.render(createFakeFrame())
    expect(contextOf(canvas).calls.filter((c) => c.method === 'drawImage')).toHaveLength(0)
  })
})
