'use client'

import { useEffect, useRef, useState } from 'react'
import { createAmbilight, createCanvasGlowRenderer, type Ambilight } from '@videoglow/core'
import { createVideoSource } from '@videoglow/video'
import { VideoAmbilight } from '@videoglow/react-video'
import { MEDIA } from '@/lib/media'
import { StatsPanel } from '@/components/stats-panel'

interface BenchmarkRow {
  resolution: number
  frames: number
  totalMs: number
  perFrameMs: number
}

const RESOLUTIONS = [32, 64, 160, 320, 640, 1280] as const
const FRAMES_PER_RUN = 120

/**
 * Renders the same video frame repeatedly at several buffer resolutions and
 * measures the synchronous draw cost. The CSS blur is not included: it runs
 * on the compositor and is not measurable from JavaScript.
 */
async function runBenchmark(video: HTMLVideoElement): Promise<BenchmarkRow[]> {
  const rows: BenchmarkRow[] = []
  const container = document.createElement('div')
  container.style.cssText = 'position:absolute;left:-9999px;top:0;width:640px;height:360px'
  document.body.appendChild(container)
  const source = createVideoSource(video)
  try {
    for (const resolution of RESOLUTIONS) {
      const renderer = createCanvasGlowRenderer()
      const engine = createAmbilight({
        container,
        source,
        renderer,
        resolution,
        autoStart: false,
        pauseWhenOffscreen: false,
      })
      engine.renderOnce()
      const started = performance.now()
      for (let i = 0; i < FRAMES_PER_RUN; i += 1) engine.renderOnce()
      const totalMs = performance.now() - started
      rows.push({
        resolution,
        frames: FRAMES_PER_RUN,
        totalMs,
        perFrameMs: totalMs / FRAMES_PER_RUN,
      })
      engine.dispose()
      await new Promise((resolve) => requestAnimationFrame(resolve))
    }
  } finally {
    source.dispose()
    container.remove()
  }
  return rows
}

export function PerformanceDemo() {
  const videoRef = useRef<HTMLVideoElement | null>(null)
  const [ambilight, setAmbilight] = useState<Ambilight | null>(null)
  const [rows, setRows] = useState<BenchmarkRow[] | null>(null)
  const [busy, setBusy] = useState(false)
  const [ready, setReady] = useState(false)

  useEffect(() => {
    const video = videoRef.current
    if (!video) return
    const onReady = () => setReady(video.readyState >= 2)
    video.addEventListener('loadeddata', onReady)
    onReady()
    return () => video.removeEventListener('loadeddata', onReady)
  }, [])

  const start = async () => {
    const video = videoRef.current
    if (!video || busy) return
    setBusy(true)
    try {
      setRows(await runBenchmark(video))
    } finally {
      setBusy(false)
    }
  }

  return (
    <>
      <div className="stage">
        <VideoAmbilight
          ref={videoRef}
          ambilightRef={setAmbilight}
          data-testid="perf-video"
          videoClassName="video-rounded"
          src={MEDIA.pattern.webm}
          controls
          muted
          loop
          autoPlay
          playsInline
        />
      </div>
      <StatsPanel ambilight={ambilight} title="Live engine (default 160 px buffer, 30 fps cap)" />
      <section className="panel" aria-label="Benchmark">
        <h2>Draw cost per buffer resolution</h2>
        <div className="button-row">
          <button
            type="button"
            onClick={start}
            disabled={!ready || busy}
            data-testid="run-benchmark"
          >
            {busy ? 'Running...' : `Render ${FRAMES_PER_RUN} frames per resolution`}
          </button>
        </div>
        {rows ? (
          <table data-testid="benchmark-table">
            <thead>
              <tr>
                <th>Buffer long edge</th>
                <th className="num">Frames</th>
                <th className="num">Total ms</th>
                <th className="num">ms / frame</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((row) => (
                <tr key={row.resolution}>
                  <td>{row.resolution} px</td>
                  <td className="num">{row.frames}</td>
                  <td className="num">{row.totalMs.toFixed(2)}</td>
                  <td className="num" data-testid={`perf-${row.resolution}`}>
                    {row.perFrameMs.toFixed(4)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        ) : (
          <p style={{ color: 'var(--text-muted)' }}>
            Run the benchmark to measure synchronous drawImage cost on this device.
          </p>
        )}
      </section>
    </>
  )
}
