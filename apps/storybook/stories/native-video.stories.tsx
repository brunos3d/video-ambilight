import type { Meta, StoryObj } from '@storybook/react-vite'
import { VideoAmbilight, type VideoAmbilightProps } from '@videoglow/react-video'
import { MEDIA, Readout, Stage, useAmbilightRef, VIDEO_PROPS } from './fixtures'

function Demo(props: VideoAmbilightProps) {
  const [ambilight, setAmbilight] = useAmbilightRef()
  return (
    <Stage>
      <VideoAmbilight
        {...VIDEO_PROPS}
        {...props}
        ambilightRef={setAmbilight}
        videoStyle={{ borderRadius: 12 }}
      />
      <Readout ambilight={ambilight} />
    </Stage>
  )
}

const meta = {
  title: 'Sources/Native video',
  component: Demo,
  args: {
    src: MEDIA.landscape,
    blur: 80,
    opacity: 0.5,
    saturation: 3,
    brightness: 1,
    scale: 1.15,
    fps: 30,
    resolution: 160,
  },
  argTypes: {
    blur: { control: { type: 'range', min: 0, max: 200, step: 1 } },
    opacity: { control: { type: 'range', min: 0, max: 1, step: 0.05 } },
    saturation: { control: { type: 'range', min: 0, max: 6, step: 0.1 } },
    brightness: { control: { type: 'range', min: 0, max: 3, step: 0.1 } },
    scale: { control: { type: 'range', min: 0.8, max: 1.6, step: 0.01 } },
    fps: { control: { type: 'range', min: 0, max: 60, step: 1 } },
    resolution: { control: { type: 'range', min: 8, max: 640, step: 8 } },
  },
} satisfies Meta<typeof Demo>

export default meta
type Story = StoryObj<typeof meta>

/** The default configuration: the same look as the original demos. */
export const Basic: Story = {}

/** `videoFrameCallback: false` forces the animation-frame fallback (pull mode). */
export const AnimationFrameFallback: Story = { args: { videoFrameCallback: false } }

/** Without autoplay: the glow renders the poster frame once and waits. */
export const PausedUntilPlay: Story = { args: { autoPlay: false } }
