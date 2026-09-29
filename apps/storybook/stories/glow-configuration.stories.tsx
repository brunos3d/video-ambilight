import type { Meta, StoryObj } from '@storybook/react-vite'
import { VideoAmbilight, type VideoAmbilightProps } from '@videoglow/react-video'
import { MEDIA, Readout, Stage, useAmbilightRef, VIDEO_PROPS } from './fixtures'

function Demo(props: VideoAmbilightProps) {
  const [ambilight, setAmbilight] = useAmbilightRef()
  return (
    <Stage>
      <VideoAmbilight
        {...VIDEO_PROPS}
        src={MEDIA.landscape}
        {...props}
        ambilightRef={setAmbilight}
        videoStyle={{ borderRadius: 12 }}
      />
      <Readout ambilight={ambilight} />
    </Stage>
  )
}

function Row({ variants, prop }: { variants: number[]; prop: keyof VideoAmbilightProps }) {
  return (
    <Stage width="100%">
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: `repeat(${variants.length}, 1fr)`,
          gap: '4rem',
        }}
      >
        {variants.map((value) => (
          <div key={value}>
            <p style={{ color: '#9a9aa8', fontFamily: 'ui-monospace, monospace', fontSize: 12 }}>
              {prop} = {value}
            </p>
            <VideoAmbilight
              {...VIDEO_PROPS}
              controls={false}
              src={MEDIA.landscape}
              {...{ [prop]: value }}
              videoStyle={{ borderRadius: 8 }}
            />
          </div>
        ))}
      </div>
    </Stage>
  )
}

const meta = {
  title: 'Configuration/Glow',
  component: Demo,
  args: { blur: 80, opacity: 0.5, saturation: 3, brightness: 1, scale: 1.15 },
} satisfies Meta<typeof Demo>

export default meta
type Story = StoryObj<typeof meta>

export const Playground: Story = {}

/** Opacity and brightness control how strong the glow reads against the background. */
export const GlowIntensity: Story = {
  render: () => <Row prop="opacity" variants={[0.2, 0.5, 0.9]} />,
}

export const Brightness: Story = {
  render: () => <Row prop="brightness" variants={[0.6, 1, 1.8]} />,
}

/** Blur radius: small values keep shapes, large values give a soft halo. */
export const BlurValues: Story = { render: () => <Row prop="blur" variants={[20, 80, 160]} /> }

export const Saturation: Story = { render: () => <Row prop="saturation" variants={[1, 3, 6]} /> }

/** Scale controls how far the glow spills past the source box. */
export const Scale: Story = { render: () => <Row prop="scale" variants={[1, 1.15, 1.4]} /> }
