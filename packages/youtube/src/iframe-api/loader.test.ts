import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { isYouTubeIframeApiLoaded, loadYouTubeIframeApi, YOUTUBE_IFRAME_API_URL } from './loader'
import type { YouTubeApiWindow } from './types'
import { createFakeIframeApi } from '../test-utils/fake-iframe-api'

function freshWindow(): Window {
  // A distinct window object per test so the module level cache does not leak between tests.
  const win = Object.create(window) as Window & YouTubeApiWindow
  Object.defineProperty(win, 'document', { value: document, configurable: true })
  return win
}

describe('loadYouTubeIframeApi', () => {
  beforeEach(() => {
    document.head.innerHTML = ''
    vi.useFakeTimers()
  })
  afterEach(() => {
    vi.useRealTimers()
  })

  it('resolves immediately when the API is already present', async () => {
    const win = freshWindow() as Window & YouTubeApiWindow
    win.YT = createFakeIframeApi().api
    expect(isYouTubeIframeApiLoaded(win)).toBe(true)
    await expect(loadYouTubeIframeApi({ window: win })).resolves.toBe(win.YT)
    expect(document.querySelectorAll('script')).toHaveLength(0)
  })

  it('injects the script once, chains the previous ready callback and shares the promise', async () => {
    const win = freshWindow() as Window & YouTubeApiWindow
    const previous = vi.fn()
    win.onYouTubeIframeAPIReady = previous
    const first = loadYouTubeIframeApi({ window: win, nonce: 'abc' })
    const second = loadYouTubeIframeApi({ window: win })
    expect(first).toBe(second)
    const scripts = document.querySelectorAll('script')
    expect(scripts).toHaveLength(1)
    expect(scripts[0]?.src).toBe(YOUTUBE_IFRAME_API_URL)
    expect(scripts[0]?.nonce).toBe('abc')
    win.YT = createFakeIframeApi().api
    win.onYouTubeIframeAPIReady?.()
    await expect(first).resolves.toBe(win.YT)
    expect(previous).toHaveBeenCalledTimes(1)
  })

  it('does not inject a second script tag when one already exists', () => {
    const win = freshWindow()
    const script = document.createElement('script')
    script.src = YOUTUBE_IFRAME_API_URL
    document.head.appendChild(script)
    void loadYouTubeIframeApi({ window: win })
    expect(document.querySelectorAll('script')).toHaveLength(1)
  })

  it('rejects on script error and on timeout, then allows a retry', async () => {
    const win = freshWindow()
    const promise = loadYouTubeIframeApi({ window: win })
    document.querySelector('script')?.dispatchEvent(new Event('error'))
    await expect(promise).rejects.toThrow(/failed to load/)

    document.head.innerHTML = ''
    const timed = loadYouTubeIframeApi({ window: win, timeoutMs: 100 })
    vi.advanceTimersByTime(101)
    await expect(timed).rejects.toThrow(/timed out/)
    expect(loadYouTubeIframeApi({ window: win })).not.toBe(timed)
  })

  it('rejects when the ready callback fires without a Player constructor', async () => {
    const win = freshWindow() as Window & YouTubeApiWindow
    const promise = loadYouTubeIframeApi({ window: win })
    win.YT = { loaded: 1 }
    win.onYouTubeIframeAPIReady?.()
    await expect(promise).rejects.toThrow(/Player is missing/)
  })
})
