'use client'

import { useEffect, useRef } from 'react'
import { VideoAmbilight } from '@videoglow/react-video'
import { MEDIA } from '@/lib/media'

/**
 * Reproduction of the original docs/canvas demo: full-resolution canvas,
 * setInterval at 30 fps, same CSS filter. Kept for visual regression.
 */
function OriginalPipeline() {
  const videoRef = useRef<HTMLVideoElement | null>(null)
  const canvasRef = useRef<HTMLCanvasElement | null>(null)

  useEffect(() => {
    const video = videoRef.current
    const canvas = canvasRef.current
    if (!video || !canvas) return
    const context = canvas.getContext('2d')
    if (!context) return
    let interval: ReturnType<typeof setInterval> | null = null
    const repaint = () => {
      if (video.videoWidth === 0) return
      // The original never resized the canvas (300x150). This version does, so the comparison is about the buffer size.
      if (canvas.width !== video.videoWidth) {
        canvas.width = video.videoWidth
        canvas.height = video.videoHeight
      }
      context.drawImage(video, 0, 0, video.videoWidth, video.videoHeight)
    }
    const start = () => {
      if (interval === null) interval = setInterval(repaint, 1000 / 30)
    }
    const stop = () => {
      if (interval !== null) clearInterval(interval)
      interval = null
    }
    video.addEventListener('play', start)
    video.addEventListener('pause', stop)
    video.addEventListener('ended', stop)
    video.addEventListener('seeked', repaint)
    video.addEventListener('loadeddata', repaint)
    if (!video.paused) start()
    return () => {
      stop()
      video.removeEventListener('play', start)
      video.removeEventListener('pause', stop)
      video.removeEventListener('ended', stop)
      video.removeEventListener('seeked', repaint)
      video.removeEventListener('loadeddata', repaint)
    }
  }, [])

  return (
    <div style={{ position: 'relative', isolation: 'isolate' }} data-testid="baseline-original">
      <canvas
        ref={canvasRef}
        aria-hidden
        style={{
          position: 'absolute',
          inset: 0,
          width: '100%',
          height: '100%',
          zIndex: -1,
          pointerEvents: 'none',
          filter: 'blur(80px) opacity(0.5) saturate(300%)',
          transform: 'scale(1.1) translateZ(0)',
        }}
      />
      <video
        ref={videoRef}
        src={MEDIA.pattern.webm}
        muted
        loop
        autoPlay
        playsInline
        controls
        className="video-rounded"
        style={{ display: 'block', width: '100%' }}
      />
    </div>
  )
}

const CAPTION_STYLE = {
  fontSize: '0.9rem',
  color: 'var(--text-muted)',
  margin: '3rem 0 0',
  textAlign: 'center',
} as const

/** The two pipelines are stacked with generous spacing so the glow of one never enters the other's screenshot. */
export function BaselineDemo() {
  return (
    <div className="stage" style={{ display: 'grid', gap: '14rem', justifyItems: 'center' }}>
      <div>
        <OriginalPipeline />
        <p style={CAPTION_STYLE}>
          Original pipeline: full-resolution buffer, setInterval at 30 fps
        </p>
      </div>
      <div>
        <VideoAmbilight
          data-testid="baseline-new"
          videoClassName="video-rounded"
          src={MEDIA.pattern.webm}
          muted
          loop
          autoPlay
          playsInline
          controls
          blur={80}
          opacity={0.5}
          saturation={3}
          scale={1.1}
        />
        <p style={CAPTION_STYLE}>videoglow: 160 px buffer, requestVideoFrameCallback</p>
      </div>
    </div>
  )
}
