'use client'

import { useCallback, useEffect, useRef, useState, useId } from 'react'
import YTPlayer from 'youtube-player'
import cn from 'clsx'

import { YouTubePlayer, CustomEvent, PlayerStates } from '../../types/youtube-player'
import styles from './styles.module.css'

export type RecursiveVoid = (func: RecursiveVoid) => void

export type VideoAmbilightProps = {
  videoId: string
  className?: string
  classNames?: {
    videoWrapper?: string
    ambilightWrapper?: string
    aspectRatio?: string
    ambilight?: string
    ambilightVideo?: string
  }
}

const useAnimationFrame = (callback: (deltaTime: number) => void) => {
  const requestRef = useRef<number>()
  const previousTimeRef = useRef<number>()

  const animate = (time: number) => {
    if (previousTimeRef.current != undefined) {
      const deltaTime: number = time - previousTimeRef.current
      callback(deltaTime)
    }
    previousTimeRef.current = time
    requestRef.current = requestAnimationFrame(animate)
  }

  useEffect(() => {
    requestRef.current = requestAnimationFrame(animate)
    return () => cancelAnimationFrame(requestRef.current as number)
  }, [])
}

export function VideoAmbilight({ videoId, className, classNames = {} }: VideoAmbilightProps) {
  const [videoPlayer, setVideoPlayer] = useState<YouTubePlayer>()
  const [ambilightPlayer, setAmbilightPlayer] = useState<YouTubePlayer>()

  const ambilightId = useId()
  const ambilightVideoId = useId()

  const videoReady = useCallback((_event: CustomEvent) => {}, [])

  const videoStateChange = useCallback(
    (event: CustomEvent) => {
      switch (event.data) {
        case PlayerStates.PLAYING:
          ambilightPlayer?.seekTo(event.target.getCurrentTime(), true)
          ambilightPlayer?.playVideo()
          break
        case PlayerStates.PAUSED:
          ambilightPlayer?.seekTo(event.target.getCurrentTime(), true)
          ambilightPlayer?.pauseVideo()
          break
      }
    },
    [ambilightPlayer]
  )

  const optimizeAmbilight = useCallback((event: CustomEvent) => {
    const qualityLevels: string[] = [...event?.target?.getAvailableQualityLevels()]
    event?.target?.mute()
    if (qualityLevels && qualityLevels.length && qualityLevels.length > 0) {
      qualityLevels.reverse()
      const lowestLevel = qualityLevels[qualityLevels.findIndex((q) => q !== 'auto')]
      event.target.setPlaybackQuality(lowestLevel)
    }
  }, [])

  const ambilightStateChange = useCallback(
    (event: CustomEvent) => {
      switch (event.data) {
        case PlayerStates.BUFFERING:
        case PlayerStates.PLAYING:
          optimizeAmbilight(event)
          break
      }
    },
    [optimizeAmbilight]
  )

  const ambilightReady = useCallback(
    (event: CustomEvent) => {
      optimizeAmbilight(event)
    },
    [optimizeAmbilight]
  )

  const step = useCallback(() => {
    ambilightPlayer?.seekTo(videoPlayer?.getCurrentTime() || 0, true)
  }, [ambilightPlayer, videoPlayer])

  useAnimationFrame(step)

  useEffect(() => {
    const video = YTPlayer(ambilightVideoId, {
      videoId,
    }) as unknown as YouTubePlayer

    const ambilight = YTPlayer(ambilightId, {
      videoId,
    }) as unknown as YouTubePlayer

    setVideoPlayer(video)
    setAmbilightPlayer(ambilight)
  }, [ambilightId, ambilightVideoId])

  useEffect(() => {
    console.log(videoPlayer)

    videoPlayer?.on('ready', videoReady as () => void)
    videoPlayer?.on('stateChange', videoStateChange as () => void)

    ambilightPlayer?.on('ready', ambilightReady as () => void)
    ambilightPlayer?.on('stateChange', ambilightStateChange as () => void)
  }, [
    videoPlayer,
    ambilightPlayer,
    videoReady,
    ambilightReady,
    videoStateChange,
    ambilightStateChange,
  ])

  return (
    <div className={cn(styles.videoWrapper, className, classNames.videoWrapper)}>
      <div className={cn(styles.ambilightWrapper, classNames.ambilightWrapper)}>
        <div className={styles.aspectRatio}>
          <div
            className={cn(styles.ambilight, classNames.ambilight)}
            id={ambilightId}
          ></div>
          <div
            className={cn(styles.ambilightVideo, classNames.ambilightVideo)}
            id={ambilightVideoId}
          ></div>
        </div>
      </div>
    </div>
  )
}

export default VideoAmbilight
