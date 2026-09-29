import { createEmitter } from '@videoglow/core'
import type { Frame, FrameSize, FrameSource, FrameSourceEvent, Listener } from '@videoglow/core'

export type ImageLike =
  ImageBitmap | HTMLImageElement | VideoFrame | HTMLCanvasElement | OffscreenCanvas

export interface ImageFrameSource extends FrameSource {
  getImage(): ImageLike | null
  /** Swap the image. Emits `resize` when dimensions change and `invalidate`. */
  setImage(image: ImageLike | null): void
  invalidate(): void
}

function sizeOf(image: ImageLike): FrameSize {
  if (typeof HTMLImageElement !== 'undefined' && image instanceof HTMLImageElement) {
    return image.complete
      ? { width: image.naturalWidth, height: image.naturalHeight }
      : { width: 0, height: 0 }
  }
  if ('displayWidth' in image) {
    return { width: image.displayWidth, height: image.displayHeight }
  }
  return { width: image.width, height: image.height }
}

/**
 * A static frame source: renders once, and again on `invalidate()` or `setImage()`.
 * Useful for posters, thumbnails and decoded `VideoFrame`s from WebCodecs.
 */
export function createImageSource(initial: ImageLike | null = null): ImageFrameSource {
  const emitter = createEmitter<FrameSourceEvent>()
  let image = initial
  let last: FrameSize = image ? sizeOf(image) : { width: 0, height: 0 }
  let disposed = false
  let pendingLoad: HTMLImageElement | null = null

  function onLoad(): void {
    pendingLoad?.removeEventListener('load', onLoad)
    pendingLoad = null
    announce()
  }

  function announce(): void {
    if (disposed) return
    const size = image ? sizeOf(image) : { width: 0, height: 0 }
    if (size.width !== last.width || size.height !== last.height) {
      last = size
      emitter.emit({ type: 'resize', size })
    }
    if (image) {
      emitter.emit({ type: 'invalidate' })
    } else {
      emitter.emit({ type: 'clear' })
    }
  }

  function watchLoad(): void {
    pendingLoad?.removeEventListener('load', onLoad)
    pendingLoad = null
    if (
      typeof HTMLImageElement !== 'undefined' &&
      image instanceof HTMLImageElement &&
      !image.complete
    ) {
      pendingLoad = image
      image.addEventListener('load', onLoad)
    }
  }

  watchLoad()

  return {
    kind: 'image',
    mode: 'pull',
    getFrame(): Frame | null {
      if (!image) return null
      const size = sizeOf(image)
      if (!(size.width > 0) || !(size.height > 0)) return null
      return { image, width: size.width, height: size.height }
    },
    isActive: () => false,
    subscribe: (listener: Listener<FrameSourceEvent>) => emitter.subscribe(listener),
    getImage: () => image,
    setImage(next) {
      if (disposed) return
      image = next
      watchLoad()
      announce()
    },
    invalidate() {
      if (!disposed && image) emitter.emit({ type: 'invalidate' })
    },
    dispose() {
      if (disposed) return
      disposed = true
      pendingLoad?.removeEventListener('load', onLoad)
      pendingLoad = null
      image = null
      emitter.clear()
    },
  }
}
