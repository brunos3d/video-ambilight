import { createEmitter } from '@videoglow/core'
import type { Frame, FrameSource, FrameSourceEvent } from '@videoglow/core'

export interface TestSource extends FrameSource {
  emit(event: FrameSourceEvent): void
  readonly disposed: boolean
  readonly listenerCount: number
}

export function createTestSource(width = 640, height = 360, active = false): TestSource {
  const emitter = createEmitter<FrameSourceEvent>()
  const image = document.createElement('canvas')
  image.width = width
  image.height = height
  const frame: Frame = { image, width, height }
  let disposed = false
  return {
    kind: 'test',
    mode: 'push',
    getFrame: () => frame,
    isActive: () => active,
    subscribe: (listener) => emitter.subscribe(listener),
    dispose() {
      disposed = true
      emitter.clear()
    },
    emit: (event) => emitter.emit(event),
    get disposed() {
      return disposed
    },
    get listenerCount() {
      return emitter.size
    },
  }
}
