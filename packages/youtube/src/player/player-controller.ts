import { createEmitter } from '@videoglow/core'
import type { Listener, Unsubscribe } from '@videoglow/core'
import { loadYouTubeIframeApi } from '../iframe-api/loader'
import { YouTubePlayerState } from '../iframe-api/types'
import type {
  YouTubeIframeApi,
  YouTubePlayerErrorCode,
  YouTubePlayerInstance,
  YouTubePlayerVars,
} from '../iframe-api/types'

export interface YouTubePlayerControllerOptions {
  readonly videoId: string
  readonly playerVars?: YouTubePlayerVars
  /** Alternative embed host, for example `https://www.youtube-nocookie.com`. */
  readonly host?: string
  /** Provide the API directly (tests, custom loaders). Defaults to `loadYouTubeIframeApi()`. */
  readonly loadApi?: () => Promise<YouTubeIframeApi>
}

export type YouTubePlayerControllerEvent =
  | { readonly type: 'ready' }
  | { readonly type: 'statechange'; readonly state: YouTubePlayerState }
  | { readonly type: 'ratechange'; readonly rate: number }
  | { readonly type: 'error'; readonly code: YouTubePlayerErrorCode }
  | { readonly type: 'autoplayblocked' }
  | { readonly type: 'loaderror'; readonly error: unknown }
  | { readonly type: 'destroy' }

/**
 * One YouTube player with a synchronous, typed surface. Commands issued
 * before the player is ready are ignored; await `ready` when ordering matters.
 */
export interface YouTubePlayerController {
  /** The host element passed at creation. The iframe is created inside it. */
  readonly host: HTMLElement
  readonly ready: Promise<void>
  isReady(): boolean
  isDestroyed(): boolean
  getVideoId(): string
  getState(): YouTubePlayerState
  getCurrentTime(): number
  getDuration(): number
  getPlaybackRate(): number
  play(): void
  pause(): void
  seekTo(seconds: number): void
  setPlaybackRate(rate: number): void
  mute(): void
  unmute(): void
  setVolume(volume: number): void
  loadVideo(videoId: string, startSeconds?: number): void
  cueVideo(videoId: string, startSeconds?: number): void
  getIframe(): HTMLIFrameElement | null
  /** Escape hatch to the underlying `YT.Player`. Null until ready. */
  getRawPlayer(): YouTubePlayerInstance | null
  subscribe(listener: Listener<YouTubePlayerControllerEvent>): Unsubscribe
  destroy(): void
}

const DEFAULT_PLAYER_VARS: YouTubePlayerVars = {
  playsinline: 1,
  rel: 0,
}

export function createYouTubePlayer(
  host: HTMLElement,
  options: YouTubePlayerControllerOptions
): YouTubePlayerController {
  const emitter = createEmitter<YouTubePlayerControllerEvent>()
  const doc = host.ownerDocument
  const view = doc.defaultView
  // YT.Player replaces the element it is given with the iframe, so give it a disposable child.
  const mountPoint = doc.createElement('div')
  host.appendChild(mountPoint)

  let player: YouTubePlayerInstance | null = null
  let ready = false
  let destroyed = false
  let videoId = options.videoId
  let cachedState: YouTubePlayerState = YouTubePlayerState.UNSTARTED
  let resolveReady: () => void = () => {}
  const readyPromise = new Promise<void>((resolve) => {
    resolveReady = resolve
  })

  const origin = view?.location?.origin
  const playerVars: YouTubePlayerVars = {
    ...DEFAULT_PLAYER_VARS,
    ...(origin && origin !== 'null' ? { origin } : {}),
    ...options.playerVars,
    enablejsapi: 1,
  }

  const loadApi = options.loadApi ?? (() => loadYouTubeIframeApi({ window: view ?? window }))

  loadApi().then(
    (api) => {
      if (destroyed) return
      player = new api.Player(mountPoint, {
        videoId,
        width: '100%',
        height: '100%',
        host: options.host,
        playerVars,
        events: {
          onReady: () => {
            if (destroyed) return
            ready = true
            emitter.emit({ type: 'ready' })
            resolveReady()
          },
          onStateChange: (event) => {
            cachedState = event.data
            emitter.emit({ type: 'statechange', state: event.data })
          },
          onPlaybackRateChange: (event) => emitter.emit({ type: 'ratechange', rate: event.data }),
          onError: (event) => emitter.emit({ type: 'error', code: event.data }),
          onAutoplayBlocked: () => emitter.emit({ type: 'autoplayblocked' }),
        },
      })
    },
    (error: unknown) => {
      if (!destroyed) emitter.emit({ type: 'loaderror', error })
    }
  )

  function live(): YouTubePlayerInstance | null {
    return ready && !destroyed ? player : null
  }

  const controller: YouTubePlayerController = {
    host,
    ready: readyPromise,
    isReady: () => ready && !destroyed,
    isDestroyed: () => destroyed,
    getVideoId: () => videoId,
    getState() {
      const raw = live()
      if (!raw) return cachedState
      const state = raw.getPlayerState()
      return typeof state === 'number' ? state : cachedState
    },
    getCurrentTime() {
      const time = live()?.getCurrentTime()
      return typeof time === 'number' && Number.isFinite(time) ? time : 0
    },
    getDuration() {
      const duration = live()?.getDuration()
      return typeof duration === 'number' && Number.isFinite(duration) ? duration : 0
    },
    getPlaybackRate() {
      const rate = live()?.getPlaybackRate()
      return typeof rate === 'number' && rate > 0 ? rate : 1
    },
    play: () => live()?.playVideo(),
    pause: () => live()?.pauseVideo(),
    seekTo: (seconds) => live()?.seekTo(Math.max(0, seconds), true),
    setPlaybackRate: (rate) => live()?.setPlaybackRate(rate),
    mute: () => live()?.mute(),
    unmute: () => live()?.unMute(),
    setVolume: (volume) => live()?.setVolume(Math.min(100, Math.max(0, volume))),
    loadVideo(next, startSeconds) {
      videoId = next
      live()?.loadVideoById(next, startSeconds)
    },
    cueVideo(next, startSeconds) {
      videoId = next
      live()?.cueVideoById(next, startSeconds)
    },
    getIframe() {
      try {
        return live()?.getIframe() ?? null
      } catch {
        return null
      }
    },
    getRawPlayer: () => live(),
    subscribe: (listener) => emitter.subscribe(listener),
    destroy() {
      if (destroyed) return
      destroyed = true
      ready = false
      try {
        player?.destroy()
      } catch {
        // The API throws when the iframe was already removed by the DOM owner. Nothing to do.
      }
      player = null
      mountPoint.remove()
      emitter.emit({ type: 'destroy' })
      emitter.clear()
    },
  }

  return controller
}
