import { describe, expect, it } from 'vitest'
import type { FrameSourceEvent } from '@videoglow/core'
import { createImageSource } from './image-source'

function loadedImage(width: number, height: number): HTMLImageElement {
  const img = document.createElement('img')
  Object.defineProperty(img, 'complete', { get: () => true })
  Object.defineProperty(img, 'naturalWidth', { get: () => width })
  Object.defineProperty(img, 'naturalHeight', { get: () => height })
  return img
}

describe('createImageSource', () => {
  it('exposes the image as a frame and is never active', () => {
    const source = createImageSource(loadedImage(300, 200))
    expect(source.isActive()).toBe(false)
    expect(source.getFrame()).toMatchObject({ width: 300, height: 200 })
  })

  it('emits resize and invalidate when the image is swapped, clear when removed', () => {
    const source = createImageSource(loadedImage(300, 200))
    const events: FrameSourceEvent[] = []
    source.subscribe((e) => events.push(e))
    const canvas = document.createElement('canvas')
    canvas.width = 64
    canvas.height = 64
    source.setImage(canvas)
    source.setImage(null)
    expect(events).toEqual([
      { type: 'resize', size: { width: 64, height: 64 } },
      { type: 'invalidate' },
      { type: 'resize', size: { width: 0, height: 0 } },
      { type: 'clear' },
    ])
  })

  it('waits for a not yet loaded image element', () => {
    const img = document.createElement('img')
    let complete = false
    Object.defineProperty(img, 'complete', { get: () => complete })
    Object.defineProperty(img, 'naturalWidth', { get: () => (complete ? 120 : 0) })
    Object.defineProperty(img, 'naturalHeight', { get: () => (complete ? 80 : 0) })
    const source = createImageSource(img)
    const events: FrameSourceEvent[] = []
    source.subscribe((e) => events.push(e))
    expect(source.getFrame()).toBeNull()
    complete = true
    img.dispatchEvent(new Event('load'))
    expect(events).toEqual([
      { type: 'resize', size: { width: 120, height: 80 } },
      { type: 'invalidate' },
    ])
    expect(source.getFrame()).toMatchObject({ width: 120, height: 80 })
  })

  it('dispose drops the image and listeners', () => {
    const source = createImageSource(loadedImage(1, 1))
    source.dispose()
    expect(source.getImage()).toBeNull()
    expect(source.getFrame()).toBeNull()
  })
})
