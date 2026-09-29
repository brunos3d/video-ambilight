import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import type { FrameSourceEvent } from '@videoglow/core'
import { createVideoSource } from './video-source'
import { createFakeVideo } from './test-utils/fake-video'

function collect(source: { subscribe: (l: (e: FrameSourceEvent) => void) => () => void }) {
  const events: FrameSourceEvent[] = []
  const unsubscribe = source.subscribe((e) => events.push(e))
  return { events, unsubscribe, types: () => events.map((e) => e.type) }
}

describe('createVideoSource', () => {
  beforeEach(() => {
    vi.useFakeTimers()
  })
  afterEach(() => {
    vi.useRealTimers()
  })

  it('uses push mode when requestVideoFrameCallback exists, pull otherwise', () => {
    expect(createVideoSource(createFakeVideo(true)).mode).toBe('push')
    expect(createVideoSource(createFakeVideo(false)).mode).toBe('pull')
    expect(createVideoSource(createFakeVideo(true), { videoFrameCallback: false }).mode).toBe(
      'pull'
    )
  })

  it('returns no frame before data is available or with zero dimensions', () => {
    const video = createFakeVideo()
    const source = createVideoSource(video)
    expect(source.getFrame()).toBeNull()
    video.set({ readyState: 1, videoWidth: 640, videoHeight: 360 })
    expect(source.getFrame()).toBeNull()
    video.set({ readyState: 2, videoWidth: 0 })
    expect(source.getFrame()).toBeNull()
    video.set({ videoWidth: 640, currentTime: 3 })
    expect(source.getFrame()).toEqual({ image: video, width: 640, height: 360, time: 3 })
  })

  it('emits resize once per dimension change on metadata and resize events', () => {
    const video = createFakeVideo()
    const source = createVideoSource(video)
    const { events } = collect(source)
    video.set({ videoWidth: 1280, videoHeight: 720 })
    video.dispatchEvent(new Event('loadedmetadata'))
    video.dispatchEvent(new Event('resize'))
    video.set({ videoWidth: 640, videoHeight: 360 })
    video.dispatchEvent(new Event('resize'))
    expect(events).toEqual([
      { type: 'resize', size: { width: 1280, height: 720 } },
      { type: 'resize', size: { width: 640, height: 360 } },
    ])
  })

  it('announces frames through requestVideoFrameCallback while playing', () => {
    const video = createFakeVideo()
    video.set({ readyState: 4, videoWidth: 1280, videoHeight: 720 })
    const source = createVideoSource(video)
    const { events, types } = collect(source)
    video.set({ paused: false })
    video.dispatchEvent(new Event('playing'))
    expect(types()).toEqual(['active'])
    expect(source.isActive()).toBe(true)
    expect(video.frameCallbacks.size).toBe(1)
    video.fireFrame({ mediaTime: 0.5 })
    video.fireFrame({ mediaTime: 0.533 })
    const frames = events.filter((e) => e.type === 'frame')
    expect(frames).toHaveLength(2)
    expect(frames[0]).toMatchObject({ frame: { width: 1280, height: 720, time: 0.5 } })
    expect(video.frameCallbacks.size).toBe(1)
    video.set({ paused: true })
    video.dispatchEvent(new Event('pause'))
    expect(types().at(-1)).toBe('idle')
    expect(video.frameCallbacks.size).toBe(0)
  })

  it('falls back to pull mode when no frame callback arrives after playback starts', () => {
    const video = createFakeVideo()
    video.set({ readyState: 4, videoWidth: 1280, videoHeight: 720, paused: false })
    const source = createVideoSource(video, { frameCallbackTimeoutMs: 500 })
    const { types } = collect(source)
    video.dispatchEvent(new Event('playing'))
    vi.advanceTimersByTime(499)
    expect(source.mode).toBe('push')
    vi.advanceTimersByTime(1)
    expect(source.mode).toBe('pull')
    expect(video.frameCallbacks.size).toBe(0)
    expect(types()).toEqual(['active', 'active'])
  })

  it('does not fall back while the document is hidden', () => {
    const video = createFakeVideo()
    video.set({ readyState: 4, videoWidth: 1280, videoHeight: 720, paused: false })
    const source = createVideoSource(video, { frameCallbackTimeoutMs: 100 })
    Object.defineProperty(document, 'visibilityState', { configurable: true, get: () => 'hidden' })
    video.dispatchEvent(new Event('playing'))
    vi.advanceTimersByTime(300)
    expect(source.mode).toBe('push')
    Object.defineProperty(document, 'visibilityState', { configurable: true, get: () => 'visible' })
    video.fireFrame()
    vi.advanceTimersByTime(300)
    expect(source.mode).toBe('push')
  })

  it('emits invalidate on seeked and loadeddata, idle on waiting, and clear on emptied', () => {
    const video = createFakeVideo()
    const source = createVideoSource(video)
    const { types } = collect(source)
    video.dispatchEvent(new Event('loadeddata'))
    video.dispatchEvent(new Event('seeked'))
    video.dispatchEvent(new Event('waiting'))
    video.dispatchEvent(new Event('emptied'))
    expect(types()).toEqual(['invalidate', 'invalidate', 'idle', 'idle', 'clear'])
  })

  it('starts the frame callback chain when created for an already playing video', () => {
    const video = createFakeVideo()
    video.set({ readyState: 4, videoWidth: 640, videoHeight: 360, paused: false })
    createVideoSource(video)
    expect(video.frameCallbacks.size).toBe(1)
  })

  it('dispose removes listeners, cancels callbacks and timers', () => {
    const video = createFakeVideo()
    video.set({ readyState: 4, videoWidth: 640, videoHeight: 360, paused: false })
    const removeSpy = vi.spyOn(video, 'removeEventListener')
    const source = createVideoSource(video)
    const { events } = collect(source)
    video.dispatchEvent(new Event('playing'))
    source.dispose()
    expect(video.frameCallbacks.size).toBe(0)
    expect(removeSpy.mock.calls.map((c) => c[0])).toEqual(
      expect.arrayContaining([
        'playing',
        'pause',
        'ended',
        'waiting',
        'loadedmetadata',
        'resize',
        'seeked',
        'emptied',
      ])
    )
    const before = events.length
    video.dispatchEvent(new Event('seeked'))
    vi.advanceTimersByTime(5000)
    expect(events.length).toBe(before)
    expect(source.isActive()).toBe(false)
  })
})
