import { YouTubePlayerState } from '../iframe-api/types'
import type {
  YouTubeIframeApi,
  YouTubePlayerErrorCode,
  YouTubePlayerEventHandlers,
  YouTubePlayerInstance,
  YouTubePlayerOptions,
} from '../iframe-api/types'

export interface FakePlayer extends YouTubePlayerInstance {
  readonly element: HTMLElement
  readonly options: YouTubePlayerOptions
  readonly calls: Array<{ method: string; args: unknown[] }>
  state: YouTubePlayerState
  time: number
  rate: number
  muted: boolean
  destroyed: boolean
  emitReady(): void
  emitState(state: YouTubePlayerState): void
  emitRate(rate: number): void
  emitError(code: YouTubePlayerErrorCode): void
  emitAutoplayBlocked(): void
  callsTo(method: string): unknown[][]
}

export interface FakeIframeApi {
  readonly api: YouTubeIframeApi
  readonly players: FakePlayer[]
}

export function createFakeIframeApi(): FakeIframeApi {
  const players: FakePlayer[] = []

  class Player implements FakePlayer {
    element: HTMLElement
    options: YouTubePlayerOptions
    calls: Array<{ method: string; args: unknown[] }> = []
    state: YouTubePlayerState = YouTubePlayerState.UNSTARTED
    time = 0
    rate = 1
    muted = false
    destroyed = false
    private iframe: HTMLIFrameElement
    private listeners = new Map<
      string,
      Set<(event: { target: YouTubePlayerInstance; data: unknown }) => void>
    >()

    constructor(element: HTMLElement | string, options: YouTubePlayerOptions) {
      this.element =
        typeof element === 'string' ? (document.getElementById(element) as HTMLElement) : element
      this.options = options
      this.iframe = document.createElement('iframe')
      this.element.replaceWith(this.iframe)
      players.push(this)
    }

    private record(method: string, ...args: unknown[]): void {
      this.calls.push({ method, args })
    }
    callsTo(method: string): unknown[][] {
      return this.calls.filter((c) => c.method === method).map((c) => c.args)
    }
    private dispatch<K extends keyof YouTubePlayerEventHandlers>(name: K, data: unknown): void {
      const handler = this.options.events?.[name] as
        ((event: { target: YouTubePlayerInstance; data: unknown }) => void) | undefined
      handler?.({ target: this, data })
      for (const listener of this.listeners.get(name) ?? []) listener({ target: this, data })
    }
    emitReady(): void {
      this.dispatch('onReady', undefined)
    }
    emitState(state: YouTubePlayerState): void {
      this.state = state
      this.dispatch('onStateChange', state)
    }
    emitRate(rate: number): void {
      this.rate = rate
      this.dispatch('onPlaybackRateChange', rate)
    }
    emitError(code: YouTubePlayerErrorCode): void {
      this.dispatch('onError', code)
    }
    emitAutoplayBlocked(): void {
      this.dispatch('onAutoplayBlocked', undefined)
    }

    playVideo(): void {
      this.record('playVideo')
    }
    pauseVideo(): void {
      this.record('pauseVideo')
    }
    stopVideo(): void {
      this.record('stopVideo')
    }
    seekTo(seconds: number, allowSeekAhead: boolean): void {
      this.record('seekTo', seconds, allowSeekAhead)
      this.time = seconds
    }
    mute(): void {
      this.record('mute')
      this.muted = true
    }
    unMute(): void {
      this.record('unMute')
      this.muted = false
    }
    isMuted(): boolean {
      return this.muted
    }
    setVolume(volume: number): void {
      this.record('setVolume', volume)
    }
    getVolume(): number {
      return 100
    }
    setPlaybackRate(rate: number): void {
      this.record('setPlaybackRate', rate)
      this.rate = rate
    }
    getPlaybackRate(): number {
      return this.rate
    }
    getAvailablePlaybackRates(): readonly number[] {
      return [0.5, 1, 1.5, 2]
    }
    getPlayerState(): YouTubePlayerState {
      return this.state
    }
    getCurrentTime(): number {
      return this.time
    }
    getDuration(): number {
      return 600
    }
    getVideoLoadedFraction(): number {
      return 1
    }
    getVideoUrl(): string {
      return `https://www.youtube.com/watch?v=${this.options.videoId ?? ''}`
    }
    loadVideoById(videoId: string, startSeconds?: number): void {
      this.record('loadVideoById', videoId, startSeconds)
    }
    cueVideoById(videoId: string, startSeconds?: number): void {
      this.record('cueVideoById', videoId, startSeconds)
    }
    getIframe(): HTMLIFrameElement {
      return this.iframe
    }
    destroy(): void {
      this.record('destroy')
      this.destroyed = true
      this.iframe.remove()
    }
    addEventListener(event: string, listener: (event: never) => void): void {
      if (!this.listeners.has(event)) this.listeners.set(event, new Set())
      this.listeners
        .get(event)
        ?.add(listener as (event: { target: YouTubePlayerInstance; data: unknown }) => void)
    }
    removeEventListener(event: string, listener: (event: never) => void): void {
      this.listeners
        .get(event)
        ?.delete(listener as (event: { target: YouTubePlayerInstance; data: unknown }) => void)
    }
  }

  return {
    api: { Player, PlayerState: YouTubePlayerState },
    players,
  }
}

/** Drain pending microtasks without relying on timers (works under fake timers). */
export async function flushPromises(): Promise<void> {
  for (let i = 0; i < 20; i += 1) await Promise.resolve()
}
