'use client'

import { useEffect, useMemo, useRef, useState } from 'react'
import type { Ambilight } from '@videoglow/core'
import { createCanvasSource } from '@videoglow/canvas'
import { Ambilight as AmbilightBox, useFrameSource, type AmbilightHandle } from '@videoglow/react'
import { StatsPanel } from '@/components/stats-panel'

/** Draws moving colored circles so the glow has something to follow. */
function useAnimatedCanvas(canvas: HTMLCanvasElement | null, running: boolean): void {
  useEffect(() => {
    if (!canvas || !running) return
    const ctx = canvas.getContext('2d')
    if (!ctx) return
    let handle = 0
    const draw = (time: number) => {
      const { width, height } = canvas
      ctx.fillStyle = '#05050a'
      ctx.fillRect(0, 0, width, height)
      for (let i = 0; i < 5; i += 1) {
        const t = time / 1000 + i * 1.3
        const x = width / 2 + Math.cos(t) * width * 0.3
        const y = height / 2 + Math.sin(t * 1.7) * height * 0.3
        ctx.fillStyle = `hsl(${(i * 72 + time / 20) % 360} 90% 60%)`
        ctx.beginPath()
        ctx.arc(x, y, Math.min(width, height) * 0.18, 0, Math.PI * 2)
        ctx.fill()
      }
      handle = requestAnimationFrame(draw)
    }
    handle = requestAnimationFrame(draw)
    return () => cancelAnimationFrame(handle)
  }, [canvas, running])
}

export function CanvasDemo() {
  const [canvas, setCanvas] = useState<HTMLCanvasElement | null>(null)
  const [running, setRunning] = useState(true)
  const [source, sourceRef] = useFrameSource((el: HTMLCanvasElement) =>
    createCanvasSource(el, { mode: 'continuous' })
  )
  const handle = useRef<AmbilightHandle | null>(null)
  const [ambilight, setAmbilight] = useState<Ambilight | null>(null)

  useAnimatedCanvas(canvas, running)
  useEffect(() => {
    source?.setActive(running)
  }, [source, running])

  const canvasRef = useMemo(
    () => (el: HTMLCanvasElement | null) => {
      setCanvas(el)
      sourceRef(el)
    },
    [sourceRef]
  )

  return (
    <>
      <div className="stage">
        <AmbilightBox
          ref={(h) => {
            handle.current = h
            setAmbilight(h?.getAmbilight() ?? null)
          }}
          source={source}
          blur={70}
          opacity={0.7}
          saturation={2.5}
          data-testid="canvas-demo"
        >
          <canvas
            ref={canvasRef}
            width={640}
            height={360}
            className="video-rounded"
            style={{ display: 'block', width: '100%' }}
          />
        </AmbilightBox>
      </div>
      <div className="button-row">
        <button type="button" onClick={() => setRunning((r) => !r)} data-testid="toggle-animation">
          {running ? 'Pause animation' : 'Resume animation'}
        </button>
        <button type="button" onClick={() => source?.invalidate()} data-testid="render-once">
          Render once
        </button>
      </div>
      <StatsPanel ambilight={ambilight} />
    </>
  )
}
