import type {
  AnimationScheduler,
  Frame,
  FrameSize,
  FrameSource,
  FrameSourceEvent,
  FrameSourceMode,
  GlowRenderer,
  GlowStyle,
  Listener,
} from '../types'
import { createEmitter } from '../emitter'
import { resolveBufferSize } from '../buffer-size'

export interface FakeSource extends FrameSource {
  emit(event: FrameSourceEvent): void
  setFrame(frame: Frame | null): void
  setActive(active: boolean): void
  readonly listenerCount: number
  readonly disposed: boolean
}

export function createFakeFrame(width = 1280, height = 720, time?: number): Frame {
  const image = document.createElement('canvas')
  image.width = width
  image.height = height
  return time === undefined ? { image, width, height } : { image, width, height, time }
}

export function createFakeSource(
  mode: FrameSourceMode = 'pull',
  frame: Frame | null = createFakeFrame()
): FakeSource {
  const emitter = createEmitter<FrameSourceEvent>()
  let current = frame
  let active = false
  let disposed = false
  return {
    kind: 'fake',
    mode,
    getFrame: () => current,
    isActive: () => active,
    subscribe: (listener: Listener<FrameSourceEvent>) => emitter.subscribe(listener),
    dispose() {
      disposed = true
      emitter.clear()
    },
    emit: (event) => emitter.emit(event),
    setFrame(next) {
      current = next
    },
    setActive(next) {
      active = next
      emitter.emit({ type: next ? 'active' : 'idle' })
    },
    get listenerCount() {
      return emitter.size
    },
    get disposed() {
      return disposed
    },
  }
}

export interface StubRenderer extends GlowRenderer {
  readonly rendered: Frame[]
  readonly styles: GlowStyle[]
  readonly resolutions: number[]
  clears: number
  disposed: boolean
  failNext: boolean
}

export function createStubRenderer(): StubRenderer {
  const element = document.createElement('div')
  let buffer: FrameSize = { width: 0, height: 0 }
  let resolution = 160
  const renderer: StubRenderer = {
    element,
    rendered: [],
    styles: [],
    resolutions: [],
    clears: 0,
    disposed: false,
    failNext: false,
    render(frame) {
      if (renderer.failNext) {
        renderer.failNext = false
        throw new Error('render failed')
      }
      buffer = resolveBufferSize(frame, resolution)
      renderer.rendered.push(frame)
    },
    setStyle(style) {
      renderer.styles.push(style)
    },
    setResolution(next) {
      resolution = next
      renderer.resolutions.push(next)
    },
    getBufferSize: () => buffer,
    clear() {
      renderer.clears += 1
    },
    dispose() {
      renderer.disposed = true
      element.remove()
    },
  }
  return renderer
}

export interface ManualScheduler extends AnimationScheduler {
  /** Run every pending callback once with the given time. */
  tick(time: number): void
  readonly pending: number
}

export function createManualScheduler(): ManualScheduler {
  const callbacks = new Map<number, (time: number) => void>()
  let nextHandle = 1
  return {
    request(callback) {
      const handle = nextHandle++
      callbacks.set(handle, callback)
      return handle
    },
    cancel(handle) {
      callbacks.delete(handle)
    },
    tick(time) {
      const batch = Array.from(callbacks.entries())
      callbacks.clear()
      for (const [, callback] of batch) callback(time)
    },
    get pending() {
      return callbacks.size
    },
  }
}

export function createClock(start = 0): {
  now: () => number
  advance: (ms: number) => number
  set: (t: number) => void
} {
  let time = start
  return {
    now: () => time,
    advance(ms) {
      time += ms
      return time
    },
    set(next) {
      time = next
    },
  }
}
