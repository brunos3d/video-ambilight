import {
  applyGlowLayerLayout,
  applyGlowStyle,
  GLOW_DATA_ATTRIBUTE,
  prepareGlowContainer,
  resolveGlowStyle,
} from '@videoglow/core'
import type { GlowStyle, GlowStyleOptions } from '@videoglow/core'
import type { YouTubeIframeApi, YouTubePlayerVars } from './iframe-api/types'
import { createYouTubePlayer } from './player/player-controller'
import type { YouTubePlayerController } from './player/player-controller'
import { createPlaybackCoordinator } from './sync/playback-coordinator'
import type { PlaybackCoordinator, SynchronizationPolicy } from './sync/playback-coordinator'

export interface YouTubeAmbilightOptions {
  readonly videoId: string
  /** Player parameters for the visible player. */
  readonly playerVars?: YouTubePlayerVars
  /** Overrides for the glow player. Controls are always disabled and audio is muted. */
  readonly followerPlayerVars?: YouTubePlayerVars
  readonly host?: string
  readonly glow?: GlowStyleOptions
  readonly sync?: Partial<SynchronizationPolicy>
  /** CSS `aspect-ratio` of the player box. Default `16 / 9`. */
  readonly aspectRatio?: string
  readonly classNames?: {
    readonly glow?: string
    readonly player?: string
  }
  /** Start synchronizing immediately. Default true. */
  readonly autoStart?: boolean
  readonly loadApi?: () => Promise<YouTubeIframeApi>
}

export interface YouTubeAmbilight {
  /** The container passed in. */
  readonly element: HTMLElement
  /** Host of the blurred follower player. */
  readonly glowElement: HTMLElement
  /** Host of the visible leader player. */
  readonly playerElement: HTMLElement
  readonly leader: YouTubePlayerController
  readonly follower: YouTubePlayerController
  readonly coordinator: PlaybackCoordinator
  /** Resolves when both players are ready. */
  readonly ready: Promise<void>
  update(glow: GlowStyleOptions): void
  getGlowStyle(): GlowStyle
  loadVideo(videoId: string, startSeconds?: number): void
  dispose(): void
}

const FOLLOWER_PLAYER_VARS: YouTubePlayerVars = {
  controls: 0,
  disablekb: 1,
  fs: 0,
  iv_load_policy: 3,
  rel: 0,
  mute: 1,
  playsinline: 1,
  autoplay: 0,
}

/**
 * Creates the two-player YouTube Ambilight inside `container`: a blurred,
 * muted follower behind the visible player, kept in sync by a
 * `PlaybackCoordinator`. Cross-origin iframe pixels cannot be sampled, so this
 * integration does not use the canvas renderer.
 */
export function createYouTubeAmbilight(
  container: HTMLElement,
  options: YouTubeAmbilightOptions
): YouTubeAmbilight {
  const doc = container.ownerDocument
  let glowStyle = resolveGlowStyle(options.glow)

  prepareGlowContainer(container)

  const playerElement = doc.createElement('div')
  playerElement.setAttribute(GLOW_DATA_ATTRIBUTE, 'player')
  if (options.classNames?.player) playerElement.className = options.classNames.player
  Object.assign(playerElement.style, {
    position: 'relative',
    width: '100%',
    aspectRatio: options.aspectRatio ?? '16 / 9',
  })

  const glowElement = doc.createElement('div')
  glowElement.setAttribute(GLOW_DATA_ATTRIBUTE, 'glow')
  glowElement.setAttribute('aria-hidden', 'true')
  if (options.classNames?.glow) glowElement.className = options.classNames.glow
  applyGlowLayerLayout(glowElement)
  // A filtered iframe layer is clipped by some engines unless the layer has slack around it.
  glowElement.style.boxShadow = '0 0 120px rgba(0, 0, 0, 0)'
  applyGlowStyle(glowElement, glowStyle)

  container.insertBefore(glowElement, container.firstChild)
  container.appendChild(playerElement)

  const leader = createYouTubePlayer(playerElement, {
    videoId: options.videoId,
    playerVars: options.playerVars,
    host: options.host,
    loadApi: options.loadApi,
  })
  const follower = createYouTubePlayer(glowElement, {
    videoId: options.videoId,
    playerVars: { ...FOLLOWER_PLAYER_VARS, ...options.followerPlayerVars, mute: 1, controls: 0 },
    host: options.host,
    loadApi: options.loadApi,
  })
  const coordinator = createPlaybackCoordinator(leader, follower, options.sync)

  function fillHost(controller: YouTubePlayerController): void {
    const iframe = controller.getIframe()
    if (!iframe) return
    Object.assign(iframe.style, {
      position: 'absolute',
      top: '0',
      left: '0',
      width: '100%',
      height: '100%',
      border: '0',
    })
    iframe.setAttribute('width', '100%')
    iframe.setAttribute('height', '100%')
  }

  const ready = Promise.all([leader.ready, follower.ready]).then(() => {
    fillHost(leader)
    fillHost(follower)
    const followerIframe = follower.getIframe()
    followerIframe?.setAttribute('tabindex', '-1')
    followerIframe?.setAttribute('aria-hidden', 'true')
  })

  if (options.autoStart ?? true) coordinator.start()

  let disposed = false

  return {
    element: container,
    glowElement,
    playerElement,
    leader,
    follower,
    coordinator,
    ready,
    update(glow) {
      if (disposed) return
      glowStyle = resolveGlowStyle(glow, glowStyle)
      applyGlowStyle(glowElement, glowStyle)
    },
    getGlowStyle: () => glowStyle,
    loadVideo(videoId, startSeconds) {
      if (disposed) return
      leader.loadVideo(videoId, startSeconds)
      follower.cueVideo(videoId, startSeconds)
    },
    dispose() {
      if (disposed) return
      disposed = true
      coordinator.dispose()
      leader.destroy()
      follower.destroy()
      glowElement.remove()
      playerElement.remove()
    },
  }
}
