import { createEmitter } from '@videoglow/core'
import type { Frame, FrameSource, FrameSourceEvent, Listener } from '@videoglow/core'

/**
 * `continuous`: the canvas changes every frame (animations, video drawn into canvas).
 * The engine samples it on its animation loop while active.
 * `manual`: the consumer calls `invalidate()` after drawing.
 */
export type CanvasSourceMode = 'continuous' | 'manual'

export interface CanvasSourceOptions {
  /** Default `continuous`. */
  readonly mode?: CanvasSourceMode
  /** Initial active state for continuous sources. Default true. */
  readonly active?: boolean
}

export interface CanvasFrameSource extends FrameSource {
  readonly canvas: HTMLCanvasElement | OffscreenCanvas
  /** Render the current canvas content once. Works in both modes. */
  invalidate(): void
  /** Start or stop continuous sampling. Ignored for manual sources. */
  setActive(active: boolean): void
}

export function createCanvasSource(
  canvas: HTMLCanvasElement | OffscreenCanvas,
  options: CanvasSourceOptions = {}
): CanvasFrameSource {
  const mode: CanvasSourceMode = options.mode ?? 'continuous'
  const emitter = createEmitter<FrameSourceEvent>()
  let active = mode === 'continuous' && (options.active ?? true)
  let disposed = false

  function getFrame(): Frame | null {
    const { width, height } = canvas
    if (!(width > 0) || !(height > 0)) return null
    return { image: canvas, width, height }
  }

  return {
    kind: 'canvas',
    mode: 'pull',
    canvas,
    getFrame,
    isActive: () => !disposed && active,
    subscribe: (listener: Listener<FrameSourceEvent>) => emitter.subscribe(listener),
    invalidate() {
      if (!disposed) emitter.emit({ type: 'invalidate' })
    },
    setActive(next) {
      if (disposed || mode !== 'continuous' || next === active) return
      active = next
      emitter.emit({ type: next ? 'active' : 'idle' })
    },
    dispose() {
      if (disposed) return
      disposed = true
      active = false
      emitter.clear()
    },
  }
}
