'use client'

import { useEffect, useRef, useState } from 'react'
import { createAmbilight, type Ambilight } from '@videoglow/core'
import { createVideoSource } from '@videoglow/video'
import { MEDIA } from '@/lib/media'
import { StatsPanel } from '@/components/stats-panel'

/**
 * Uses the engine the way a non-React app would: plain DOM nodes, explicit
 * create/dispose. React only provides the mount point here.
 */
export function CoreDemo() {
  const host = useRef<HTMLDivElement | null>(null)
  const [ambilight, setAmbilight] = useState<Ambilight | null>(null)

  useEffect(() => {
    const container = host.current
    if (!container) return
    const video = document.createElement('video')
    video.src = MEDIA.pattern.webm
    video.controls = true
    video.muted = true
    video.loop = true
    video.autoplay = true
    video.playsInline = true
    video.className = 'video-rounded'
    video.style.cssText = 'display:block;width:100%'
    video.setAttribute('data-testid', 'core-video')
    container.appendChild(video)

    const source = createVideoSource(video)
    const engine = createAmbilight({ container, source, blur: 90, saturation: 3, scale: 1.2 })
    setAmbilight(engine)

    return () => {
      engine.dispose()
      source.dispose()
      video.remove()
      setAmbilight(null)
    }
  }, [])

  return (
    <>
      <div className="stage">
        <div ref={host} data-testid="core-host" />
      </div>
      <StatsPanel ambilight={ambilight} />
    </>
  )
}
