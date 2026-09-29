import { createEmitter } from '@videoglow/core'
import type {
  Frame,
  FrameSource,
  FrameSourceEvent,
  FrameSourceMode,
  Listener,
} from '@videoglow/core'

export interface VideoSourceOptions {
  /** Use `requestVideoFrameCallback` when the browser supports it. Default true. */
  readonly videoFrameCallback?: boolean
  /**
   * How long to wait for the first video frame callback after playback starts
   * before switching to animation-frame polling. Covers engines that expose the
   * API but never fire it (Safari with DRM). Default 1000 ms.
   */
  readonly frameCallbackTimeoutMs?: number
}

export interface VideoFrameSource extends FrameSource {
  readonly video: HTMLVideoElement
}

/** `HTMLMediaElement.readyState` value from which a frame can be drawn. */
export const HAVE_CURRENT_DATA = 2

type VideoFrameCallbackMetadata = {
  readonly mediaTime: number
  readonly width: number
  readonly height: number
  readonly presentedFrames: number
}

type VideoWithFrameCallback = HTMLVideoElement & {
  requestVideoFrameCallback?: (
    callback: (now: number, metadata: VideoFrameCallbackMetadata) => void
  ) => number
  cancelVideoFrameCallback?: (handle: number) => void
}

const ACTIVE_EVENTS = ['playing'] as const
const IDLE_EVENTS = ['pause', 'ended', 'waiting', 'error', 'abort'] as const
const SIZE_EVENTS = ['loadedmetadata', 'resize'] as const
const INVALIDATE_EVENTS = ['loadeddata', 'seeked'] as const

/**
 * Wraps an `HTMLVideoElement` as a frame source.
 *
 * Push mode (default when supported): every presented frame is announced
 * through `requestVideoFrameCallback`. Pull mode: the engine polls the element
 * on its animation loop while the video is playing.
 */
export function createVideoSource(
  video: HTMLVideoElement,
  options: VideoSourceOptions = {}
): VideoFrameSource {
  const element = video as VideoWithFrameCallback
  const emitter = createEmitter<FrameSourceEvent>()
  const timeoutMs = options.frameCallbackTimeoutMs ?? 1000
  const supportsFrameCallback =
    options.videoFrameCallback !== false &&
    typeof element.requestVideoFrameCallback === 'function' &&
    typeof element.cancelVideoFrameCallback === 'function'

  let mode: FrameSourceMode = supportsFrameCallback ? 'push' : 'pull'
  let frameCallbackHandle: number | null = null
  let watchdog: ReturnType<typeof setTimeout> | null = null
  let disposed = false
  let lastWidth = video.videoWidth
  let lastHeight = video.videoHeight

  function isPlaying(): boolean {
    return !video.paused && !video.ended && video.readyState >= HAVE_CURRENT_DATA
  }

  function getFrame(): Frame | null {
    if (video.readyState < HAVE_CURRENT_DATA || video.videoWidth === 0 || video.videoHeight === 0)
      return null
    return {
      image: video,
      width: video.videoWidth,
      height: video.videoHeight,
      time: video.currentTime,
    }
  }

  function clearWatchdog(): void {
    if (watchdog !== null) {
      clearTimeout(watchdog)
      watchdog = null
    }
  }

  function cancelFrameCallback(): void {
    if (frameCallbackHandle !== null) {
      element.cancelVideoFrameCallback?.(frameCallbackHandle)
      frameCallbackHandle = null
    }
  }

  function scheduleFrameCallback(): void {
    if (
      disposed ||
      mode !== 'push' ||
      frameCallbackHandle !== null ||
      !element.requestVideoFrameCallback
    )
      return
    frameCallbackHandle = element.requestVideoFrameCallback((_now, metadata) => {
      frameCallbackHandle = null
      clearWatchdog()
      if (disposed) return
      const width = metadata.width || video.videoWidth
      const height = metadata.height || video.videoHeight
      if (width > 0 && height > 0) {
        emitter.emit({
          type: 'frame',
          frame: { image: video, width, height, time: metadata.mediaTime },
        })
      }
      if (isPlaying()) scheduleFrameCallback()
    })
  }

  function startWatchdog(): void {
    if (mode !== 'push') return
    clearWatchdog()
    watchdog = setTimeout(() => {
      watchdog = null
      if (disposed || !isPlaying()) return
      // Callbacks are paused in hidden documents; that is not a missing implementation.
      if (video.ownerDocument.visibilityState === 'hidden') {
        startWatchdog()
        return
      }
      cancelFrameCallback()
      mode = 'pull'
      emitter.emit({ type: 'active' })
    }, timeoutMs)
  }

  function onActive(): void {
    emitter.emit({ type: 'active' })
    if (mode === 'push') {
      scheduleFrameCallback()
      startWatchdog()
    }
  }

  function onIdle(): void {
    clearWatchdog()
    cancelFrameCallback()
    emitter.emit({ type: 'idle' })
  }

  function onSizeChange(): void {
    const width = video.videoWidth
    const height = video.videoHeight
    if (width === lastWidth && height === lastHeight) return
    lastWidth = width
    lastHeight = height
    emitter.emit({ type: 'resize', size: { width, height } })
  }

  function onInvalidate(): void {
    emitter.emit({ type: 'invalidate' })
  }

  function onEmptied(): void {
    clearWatchdog()
    cancelFrameCallback()
    lastWidth = 0
    lastHeight = 0
    emitter.emit({ type: 'idle' })
    emitter.emit({ type: 'clear' })
  }

  const bindings: Array<[string, () => void]> = [
    ...ACTIVE_EVENTS.map((name): [string, () => void] => [name, onActive]),
    ...IDLE_EVENTS.map((name): [string, () => void] => [name, onIdle]),
    ...SIZE_EVENTS.map((name): [string, () => void] => [name, onSizeChange]),
    ...INVALIDATE_EVENTS.map((name): [string, () => void] => [name, onInvalidate]),
    ['emptied', onEmptied],
  ]
  for (const [name, handler] of bindings) video.addEventListener(name, handler)

  if (isPlaying() && mode === 'push') {
    scheduleFrameCallback()
    startWatchdog()
  }

  return {
    kind: 'video',
    get mode() {
      return mode
    },
    video,
    getFrame,
    isActive: () => !disposed && isPlaying(),
    subscribe: (listener: Listener<FrameSourceEvent>) => emitter.subscribe(listener),
    dispose() {
      if (disposed) return
      disposed = true
      clearWatchdog()
      cancelFrameCallback()
      for (const [name, handler] of bindings) video.removeEventListener(name, handler)
      emitter.clear()
    },
  }
}
