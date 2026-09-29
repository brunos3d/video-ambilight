import { useEffect, useMemo, useState } from 'react'
import type { Meta, StoryObj } from '@storybook/react-vite'
import { createCanvasSource, type CanvasSourceMode } from '@videoglow/canvas'
import { Ambilight, useFrameSource } from '@videoglow/react'
import { Readout, Stage, useAmbilightRef, useAnimatedCanvas } from './fixtures'

interface Args {
  mode: CanvasSourceMode
  running: boolean
  blur: number
  fps: number
}

function Demo({ mode, running, blur, fps }: Args) {
  const [canvas, setCanvas] = useState<HTMLCanvasElement | null>(null)
  const [source, sourceRef] = useFrameSource(
    (el: HTMLCanvasElement) => createCanvasSource(el, { mode }),
    [mode]
  )
  const [ambilight, setAmbilight] = useAmbilightRef()
  useAnimatedCanvas(canvas, running)
  useEffect(() => {
    source?.setActive(running)
  }, [source, running])
  useEffect(() => {
    if (mode !== 'manual' || !source) return
    const id = setInterval(() => source.invalidate(), 1000)
    return () => clearInterval(id)
  }, [mode, source])
  const ref = useMemo(
    () => (el: HTMLCanvasElement | null) => {
      setCanvas(el)
      sourceRef(el)
    },
    [sourceRef]
  )
  return (
    <Stage>
      <Ambilight
        source={source}
        blur={blur}
        fps={fps}
        ref={(h) => setAmbilight(h?.getAmbilight() ?? null)}
      >
        <canvas
          ref={ref}
          width={640}
          height={360}
          style={{ display: 'block', width: '100%', borderRadius: 12 }}
        />
      </Ambilight>
      <Readout ambilight={ambilight} />
    </Stage>
  )
}

const meta = {
  title: 'Sources/Canvas',
  component: Demo,
  args: { mode: 'continuous', running: true, blur: 70, fps: 30 },
  argTypes: { mode: { control: 'radio', options: ['continuous', 'manual'] } },
} satisfies Meta<typeof Demo>

export default meta
type Story = StoryObj<typeof meta>

/** The canvas is sampled on every animation frame (capped by fps) while active. */
export const Continuous: Story = {}

/** Manual mode renders only on `invalidate()`; this story calls it once per second. */
export const Manual: Story = { args: { mode: 'manual' } }
