import type { Meta, StoryObj } from '@storybook/react-vite'
import { VideoAmbilight } from '@videoglow/react-video'
import { MEDIA, Readout, Stage, useAmbilightRef, VIDEO_PROPS } from './fixtures'

function Demo({ fps, resolution }: { fps: number; resolution: number }) {
  const [ambilight, setAmbilight] = useAmbilightRef()
  return (
    <Stage>
      <VideoAmbilight
        {...VIDEO_PROPS}
        src={MEDIA.landscape}
        fps={fps}
        resolution={resolution}
        ambilightRef={setAmbilight}
        videoStyle={{ borderRadius: 12 }}
      />
      <Readout ambilight={ambilight} />
    </Stage>
  )
}

const meta = {
  title: 'Configuration/Sampling',
  component: Demo,
  args: { fps: 30, resolution: 160 },
  argTypes: {
    fps: { control: { type: 'range', min: 0, max: 60, step: 1 } },
    resolution: { control: { type: 'range', min: 8, max: 640, step: 8 } },
  },
} satisfies Meta<typeof Demo>

export default meta
type Story = StoryObj<typeof meta>

/** Default: 30 fps cap. Watch the skipped counter as frames above the cap are dropped. */
export const ThirtyFps: Story = {}

/** 5 fps makes the sampling visible as discrete steps in the glow. */
export const FiveFps: Story = { args: { fps: 5 } }

/** 0 removes the cap: every presented frame is drawn. */
export const Uncapped: Story = { args: { fps: 0 } }

/** A 16 px buffer still produces a convincing glow under an 80 px blur. */
export const TinyBuffer: Story = { args: { resolution: 16 } }

/** Full resolution buffer, for comparison of draw cost in the readout. */
export const FullResolutionBuffer: Story = { args: { resolution: 640 } }
