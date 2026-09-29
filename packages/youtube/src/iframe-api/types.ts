/**
 * Typed subset of the YouTube IFrame Player API used by this package.
 * Reference: https://developers.google.com/youtube/iframe_api_reference
 */

export const YouTubePlayerState = {
  UNSTARTED: -1,
  ENDED: 0,
  PLAYING: 1,
  PAUSED: 2,
  BUFFERING: 3,
  CUED: 5,
} as const

export type YouTubePlayerState = (typeof YouTubePlayerState)[keyof typeof YouTubePlayerState]

/** Error codes delivered by `onError`. 153 means the embed request had no Referer. */
export type YouTubePlayerErrorCode = 2 | 5 | 100 | 101 | 150 | 153

export type YouTubeFlag = 0 | 1

export interface YouTubePlayerVars {
  readonly autoplay?: YouTubeFlag
  readonly cc_load_policy?: 1
  readonly cc_lang_pref?: string
  readonly color?: 'red' | 'white'
  readonly controls?: YouTubeFlag
  readonly disablekb?: YouTubeFlag
  readonly enablejsapi?: YouTubeFlag
  readonly end?: number
  readonly fs?: YouTubeFlag
  readonly hl?: string
  readonly iv_load_policy?: 1 | 3
  readonly list?: string
  readonly listType?: 'playlist' | 'user_uploads'
  readonly loop?: YouTubeFlag
  readonly mute?: YouTubeFlag
  readonly origin?: string
  readonly playlist?: string
  readonly playsinline?: YouTubeFlag
  readonly rel?: YouTubeFlag
  readonly start?: number
}

export interface YouTubePlayerEvent<TData = undefined> {
  readonly target: YouTubePlayerInstance
  readonly data: TData
}

export interface YouTubePlayerEventHandlers {
  onReady?: (event: YouTubePlayerEvent) => void
  onStateChange?: (event: YouTubePlayerEvent<YouTubePlayerState>) => void
  onPlaybackQualityChange?: (event: YouTubePlayerEvent<string>) => void
  onPlaybackRateChange?: (event: YouTubePlayerEvent<number>) => void
  onError?: (event: YouTubePlayerEvent<YouTubePlayerErrorCode>) => void
  onApiChange?: (event: YouTubePlayerEvent) => void
  onAutoplayBlocked?: (event: YouTubePlayerEvent) => void
}

export type YouTubePlayerEventName = keyof YouTubePlayerEventHandlers

export interface YouTubePlayerOptions {
  readonly videoId?: string
  readonly width?: number | string
  readonly height?: number | string
  readonly host?: string
  readonly playerVars?: YouTubePlayerVars
  readonly events?: YouTubePlayerEventHandlers
}

/** The subset of `YT.Player` this package relies on. All getters are synchronous. */
export interface YouTubePlayerInstance {
  playVideo(): void
  pauseVideo(): void
  stopVideo(): void
  seekTo(seconds: number, allowSeekAhead: boolean): void
  mute(): void
  unMute(): void
  isMuted(): boolean
  setVolume(volume: number): void
  getVolume(): number
  setPlaybackRate(rate: number): void
  getPlaybackRate(): number
  getAvailablePlaybackRates(): readonly number[]
  getPlayerState(): YouTubePlayerState
  getCurrentTime(): number
  getDuration(): number
  getVideoLoadedFraction(): number
  getVideoUrl(): string
  loadVideoById(videoId: string, startSeconds?: number): void
  cueVideoById(videoId: string, startSeconds?: number): void
  getIframe(): HTMLIFrameElement
  destroy(): void
  addEventListener<K extends YouTubePlayerEventName>(
    event: K,
    listener: NonNullable<YouTubePlayerEventHandlers[K]>
  ): void
  removeEventListener<K extends YouTubePlayerEventName>(
    event: K,
    listener: NonNullable<YouTubePlayerEventHandlers[K]>
  ): void
}

export interface YouTubePlayerConstructor {
  new (element: HTMLElement | string, options: YouTubePlayerOptions): YouTubePlayerInstance
}

/** The global `YT` namespace, once loaded. */
export interface YouTubeIframeApi {
  readonly Player: YouTubePlayerConstructor
  readonly PlayerState: typeof YouTubePlayerState
}

/** Globals the IFrame API script installs on `window`. */
export interface YouTubeApiWindow {
  YT?: Partial<YouTubeIframeApi> & { loaded?: number }
  onYouTubeIframeAPIReady?: () => void
}
