import {
  forwardRef,
  useCallback,
  useImperativeHandle,
  useMemo,
  useState,
  type CSSProperties,
  type HTMLAttributes,
} from 'react'
import type {
  PlaybackCoordinator,
  YouTubeAmbilight as YouTubeAmbilightInstance,
  YouTubePlayerController,
} from '@videoglow/youtube'
import { useYouTubeAmbilight, type UseYouTubeAmbilightOptions } from './use-youtube-ambilight'

export interface YouTubeAmbilightProps
  extends
    Omit<UseYouTubeAmbilightOptions, 'container'>,
    Omit<HTMLAttributes<HTMLDivElement>, 'children'> {}

export interface YouTubeAmbilightHandle {
  getInstance(): YouTubeAmbilightInstance | null
  getLeader(): YouTubePlayerController | null
  getFollower(): YouTubePlayerController | null
  getCoordinator(): PlaybackCoordinator | null
  getElement(): HTMLDivElement | null
}

const WRAPPER_STYLE: CSSProperties = { position: 'relative', isolation: 'isolate', width: '100%' }

/**
 * A YouTube player with a synchronized, blurred second player behind it.
 */
export const YouTubeAmbilight = forwardRef<YouTubeAmbilightHandle, YouTubeAmbilightProps>(
  function YouTubeAmbilight(props, ref) {
    const {
      videoId,
      playerVars,
      followerPlayerVars,
      host,
      glow,
      sync,
      aspectRatio,
      classNames,
      autoStart,
      loadApi,
      enabled,
      onReady,
      onLeaderEvent,
      onCoordinatorEvent,
      style,
      ...rest
    } = props
    const [container, setContainer] = useState<HTMLDivElement | null>(null)
    const instance = useYouTubeAmbilight({
      container,
      videoId,
      playerVars,
      followerPlayerVars,
      host,
      glow,
      sync,
      aspectRatio,
      classNames,
      autoStart,
      loadApi,
      enabled,
      onReady,
      onLeaderEvent,
      onCoordinatorEvent,
    })

    useImperativeHandle(
      ref,
      () => ({
        getInstance: () => instance,
        getLeader: () => instance?.leader ?? null,
        getFollower: () => instance?.follower ?? null,
        getCoordinator: () => instance?.coordinator ?? null,
        getElement: () => container,
      }),
      [instance, container]
    )

    const refCallback = useCallback((node: HTMLDivElement | null) => setContainer(node), [])
    const mergedStyle = useMemo<CSSProperties>(() => ({ ...WRAPPER_STYLE, ...style }), [style])

    return <div ref={refCallback} data-videoglow="youtube" style={mergedStyle} {...rest} />
  }
)
