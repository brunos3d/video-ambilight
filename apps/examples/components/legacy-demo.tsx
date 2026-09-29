'use client'

import { VideoAmbilight } from 'react-ambilight'
import { YOUTUBE_VIDEO_ID } from '@/lib/media'

export function LegacyDemo() {
  return (
    <div className="stage">
      <VideoAmbilight videoId={YOUTUBE_VIDEO_ID} />
    </div>
  )
}
