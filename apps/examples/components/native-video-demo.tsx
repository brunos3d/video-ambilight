'use client'

import { useState } from 'react'
import type { Ambilight } from '@videoglow/core'
import { VideoAmbilight } from '@videoglow/react-video'
import { MEDIA } from '@/lib/media'
import { StatsPanel } from '@/components/stats-panel'

export function NativeVideoDemo() {
  const [ambilight, setAmbilight] = useState<Ambilight | null>(null)
  return (
    <>
      <div className="stage">
        <VideoAmbilight
          ambilightRef={setAmbilight}
          data-testid="native-video"
          videoClassName="video-rounded"
          controls
          muted
          loop
          autoPlay
          playsInline
          preload="auto"
          src={MEDIA.pattern.webm}
        />
      </div>
      <StatsPanel ambilight={ambilight} />
    </>
  )
}
