import { useEffect } from 'react'
import { resolveElement, useLatest, useOwnedResource, type ElementInput } from '@videoglow/react'
import { createYouTubeAmbilight } from '@videoglow/youtube'
import type {
  CoordinatorEvent,
  YouTubeAmbilight,
  YouTubeAmbilightOptions,
  YouTubePlayerControllerEvent,
} from '@videoglow/youtube'

export interface UseYouTubeAmbilightOptions extends YouTubeAmbilightOptions {
  readonly container: ElementInput<HTMLElement>
  /** Synchronize playback. Default true. */
  readonly enabled?: boolean
  readonly onReady?: (instance: YouTubeAmbilight) => void
  readonly onLeaderEvent?: (event: YouTubePlayerControllerEvent) => void
  readonly onCoordinatorEvent?: (event: CoordinatorEvent) => void
}

interface OwnedYouTubeAmbilight {
  readonly instance: YouTubeAmbilight
  readonly release: () => void
}

/**
 * Owns a two-player YouTube Ambilight for the lifetime of the component.
 * Changing `videoId` loads the new video into both players; changing player
 * parameters, class names or the host recreates the players.
 */
export function useYouTubeAmbilight(options: UseYouTubeAmbilightOptions): YouTubeAmbilight | null {
  const { container, videoId, enabled = true, host, aspectRatio, loadApi } = options
  const latest = useLatest(options)
  const recreateKey = JSON.stringify([
    options.playerVars ?? null,
    options.followerPlayerVars ?? null,
    options.classNames ?? null,
  ])

  const owned = useOwnedResource<OwnedYouTubeAmbilight>(
    () => {
      const element = resolveElement(container)
      if (!element) return null
      const current = latest.current
      const instance = createYouTubeAmbilight(element, {
        videoId: current.videoId,
        playerVars: current.playerVars,
        followerPlayerVars: current.followerPlayerVars,
        host,
        glow: current.glow,
        sync: current.sync,
        aspectRatio,
        classNames: current.classNames,
        autoStart: false,
        loadApi,
      })
      const unsubscribeLeader = instance.leader.subscribe((event) =>
        latest.current.onLeaderEvent?.(event)
      )
      const unsubscribeCoordinator = instance.coordinator.subscribe((event) =>
        latest.current.onCoordinatorEvent?.(event)
      )
      let active = true
      void instance.ready.then(() => {
        if (active) latest.current.onReady?.(instance)
      })
      return {
        instance,
        release() {
          active = false
          unsubscribeLeader()
          unsubscribeCoordinator()
          instance.dispose()
        },
      }
    },
    (resource) => resource.release(),
    [container, host, aspectRatio, recreateKey, loadApi]
  )
  const instance = owned?.instance ?? null

  useEffect(() => {
    if (!instance) return
    if (enabled) instance.coordinator.start()
    else instance.coordinator.stop()
  }, [instance, enabled])

  useEffect(() => {
    if (instance && instance.leader.getVideoId() !== videoId) instance.loadVideo(videoId)
  }, [instance, videoId])

  const { blur, opacity, saturation, brightness, scale } = options.glow ?? {}
  useEffect(() => {
    instance?.update({ blur, opacity, saturation, brightness, scale })
  }, [instance, blur, opacity, saturation, brightness, scale])

  const syncKey = JSON.stringify(options.sync ?? null)
  useEffect(() => {
    const sync = latest.current.sync
    if (instance && sync) instance.coordinator.setPolicy(sync)
  }, [instance, latest, syncKey])

  return instance
}
