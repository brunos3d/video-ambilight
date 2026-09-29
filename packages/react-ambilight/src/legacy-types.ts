import { YouTubePlayerState } from '@videoglow/youtube'
import type {
  YouTubePlayerEvent,
  YouTubePlayerEventName,
  YouTubePlayerInstance,
} from '@videoglow/youtube'

/** @deprecated Use `YouTubePlayerState` from `@videoglow/youtube`. */
export const PlayerStates = {
  BUFFERING: YouTubePlayerState.BUFFERING,
  ENDED: YouTubePlayerState.ENDED,
  PAUSED: YouTubePlayerState.PAUSED,
  PLAYING: YouTubePlayerState.PLAYING,
  UNSTARTED: YouTubePlayerState.UNSTARTED,
  VIDEO_CUED: YouTubePlayerState.CUED,
} as const

/** @deprecated Use `YouTubePlayerState` from `@videoglow/youtube`. */
export type PlayerStates = (typeof PlayerStates)[keyof typeof PlayerStates]

/** @deprecated Use `YouTubePlayerInstance` from `@videoglow/youtube`. */
export type YouTubePlayer = YouTubePlayerInstance

/** @deprecated Use `YouTubePlayerEvent` from `@videoglow/youtube`. */
export type CustomEvent = YouTubePlayerEvent<unknown>

/** @deprecated Use `YouTubePlayerEventName` from `@videoglow/youtube`. */
export type EventType = YouTubePlayerEventName

/** @deprecated Unused since 2.0. */
export type RecursiveVoid = (func: RecursiveVoid) => void
