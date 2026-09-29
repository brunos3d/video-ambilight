import { describe, expect, it } from 'vitest'
import type { FrameSourceEvent } from '@videoglow/core'
import { createCanvasSource } from './canvas-source'

function canvasOf(width: number, height: number): HTMLCanvasElement {
  const canvas = document.createElement('canvas')
  canvas.width = width
  canvas.height = height
  return canvas
}

describe('createCanvasSource', () => {
  it('is a pull source that is active by default in continuous mode', () => {
    const source = createCanvasSource(canvasOf(320, 180))
    expect(source.mode).toBe('pull')
    expect(source.isActive()).toBe(true)
    expect(source.getFrame()).toMatchObject({ width: 320, height: 180 })
  })

  it('is inactive in manual mode and renders through invalidate', () => {
    const source = createCanvasSource(canvasOf(320, 180), { mode: 'manual' })
    const events: FrameSourceEvent[] = []
    source.subscribe((e) => events.push(e))
    expect(source.isActive()).toBe(false)
    source.setActive(true)
    expect(source.isActive()).toBe(false)
    source.invalidate()
    expect(events).toEqual([{ type: 'invalidate' }])
  })

  it('toggles active state with events in continuous mode', () => {
    const source = createCanvasSource(canvasOf(320, 180), { active: false })
    const events: FrameSourceEvent[] = []
    source.subscribe((e) => events.push(e))
    source.setActive(true)
    source.setActive(true)
    source.setActive(false)
    expect(events).toEqual([{ type: 'active' }, { type: 'idle' }])
  })

  it('returns null for empty canvases and reflects live size changes', () => {
    const canvas = canvasOf(0, 0)
    const source = createCanvasSource(canvas)
    expect(source.getFrame()).toBeNull()
    canvas.width = 100
    canvas.height = 50
    expect(source.getFrame()).toMatchObject({ width: 100, height: 50 })
  })

  it('dispose makes the source inert', () => {
    const source = createCanvasSource(canvasOf(10, 10))
    let calls = 0
    source.subscribe(() => calls++)
    source.dispose()
    source.invalidate()
    source.setActive(false)
    expect(calls).toBe(0)
    expect(source.isActive()).toBe(false)
  })
})
