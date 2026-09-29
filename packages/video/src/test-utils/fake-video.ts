export interface FakeVideo extends HTMLVideoElement {
  set(
    props: Partial<{
      paused: boolean
      ended: boolean
      readyState: number
      videoWidth: number
      videoHeight: number
      currentTime: number
    }>
  ): void
  /** Pending requestVideoFrameCallback callbacks, in registration order. */
  frameCallbacks: Map<
    number,
    (
      now: number,
      metadata: { mediaTime: number; width: number; height: number; presentedFrames: number }
    ) => void
  >
  fireFrame(metadata?: Partial<{ mediaTime: number; width: number; height: number }>): void
}

/**
 * jsdom video element with writable media properties and an optional
 * requestVideoFrameCallback implementation driven by the test.
 */
export function createFakeVideo(withFrameCallback = true): FakeVideo {
  const video = document.createElement('video') as FakeVideo
  const state = {
    paused: true,
    ended: false,
    readyState: 0,
    videoWidth: 0,
    videoHeight: 0,
    currentTime: 0,
  }
  for (const key of Object.keys(state) as Array<keyof typeof state>) {
    Object.defineProperty(video, key, { configurable: true, get: () => state[key] })
  }
  video.set = (props) => Object.assign(state, props)
  video.frameCallbacks = new Map()
  let handle = 0
  if (withFrameCallback) {
    Object.defineProperty(video, 'requestVideoFrameCallback', {
      configurable: true,
      value: (cb: FakeVideo['frameCallbacks'] extends Map<number, infer C> ? C : never) => {
        handle += 1
        video.frameCallbacks.set(handle, cb)
        return handle
      },
    })
    Object.defineProperty(video, 'cancelVideoFrameCallback', {
      configurable: true,
      value: (h: number) => {
        video.frameCallbacks.delete(h)
      },
    })
  }
  video.fireFrame = (metadata = {}) => {
    const entries = Array.from(video.frameCallbacks.entries())
    video.frameCallbacks.clear()
    for (const [, cb] of entries) {
      cb(performance.now(), {
        mediaTime: metadata.mediaTime ?? state.currentTime,
        width: metadata.width ?? state.videoWidth,
        height: metadata.height ?? state.videoHeight,
        presentedFrames: 0,
      })
    }
  }
  return video
}
