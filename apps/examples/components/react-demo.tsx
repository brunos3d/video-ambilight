'use client'

import { useState } from 'react'
import { useAmbilight, useFrameSource } from '@videoglow/react'
import { createVideoSource } from '@videoglow/video'
import { MEDIA } from '@/lib/media'
import { StatsPanel } from '@/components/stats-panel'

/** Owns all markup: a figure with a caption, glow mounted into the figure by the hook. */
export function ReactHooksDemo() {
  const [figure, setFigure] = useState<HTMLElement | null>(null)
  const [source, videoRef] = useFrameSource((video: HTMLVideoElement) => createVideoSource(video))
  const [enabled, setEnabled] = useState(true)
  const ambilight = useAmbilight({
    container: figure,
    source,
    enabled,
    blur: 60,
    opacity: 0.6,
    scale: 1.1,
  })

  return (
    <>
      <div className="stage">
        <figure ref={setFigure} data-testid="hooks-figure" style={{ margin: 0 }}>
          <video
            ref={videoRef}
            src={MEDIA.pattern.webm}
            controls
            muted
            loop
            autoPlay
            playsInline
            className="video-rounded"
            style={{ display: 'block', width: '100%' }}
          />
          <figcaption
            style={{ marginTop: '0.75rem', color: 'var(--text-muted)', fontSize: '0.85rem' }}
          >
            The glow canvas is the first child of this figure; the video and caption stay in normal
            flow.
          </figcaption>
        </figure>
      </div>
      <div className="button-row">
        <button type="button" onClick={() => setEnabled((e) => !e)} data-testid="toggle-enabled">
          {enabled ? 'Disable glow' : 'Enable glow'}
        </button>
      </div>
      <StatsPanel ambilight={ambilight} />
    </>
  )
}
