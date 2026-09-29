import { useState } from 'react'
import type { Meta, StoryObj } from '@storybook/react-vite'
import { VideoAmbilight } from '@videoglow/react-video'
import { MEDIA, Stage, VIDEO_PROPS } from './fixtures'

const meta = {
  title: 'Layout/Dimensions and containers',
} satisfies Meta

export default meta
type Story = StoryObj<typeof meta>

/** Landscape and portrait clips: the buffer keeps the aspect ratio (160x90 vs 90x160). */
export const AspectRatios: Story = {
  render: () => (
    <Stage width="100%">
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: '2fr 1fr',
          gap: '5rem',
          alignItems: 'start',
        }}
      >
        <VideoAmbilight {...VIDEO_PROPS} src={MEDIA.landscape} videoStyle={{ borderRadius: 12 }} />
        <VideoAmbilight {...VIDEO_PROPS} src={MEDIA.portrait} videoStyle={{ borderRadius: 12 }} />
      </div>
    </Stage>
  ),
}

function Responsive() {
  const [width, setWidth] = useState(60)
  return (
    <Stage width="100%">
      <label
        style={{
          color: '#9a9aa8',
          display: 'block',
          marginBottom: '2rem',
          fontFamily: 'ui-monospace, monospace',
          fontSize: 12,
        }}
      >
        container width {width}%
        <input
          type="range"
          min={20}
          max={100}
          value={width}
          onChange={(e) => setWidth(Number(e.target.value))}
          style={{ display: 'block', width: 300 }}
        />
      </label>
      <div style={{ width: `${width}%`, transition: 'width 200ms' }}>
        <VideoAmbilight {...VIDEO_PROPS} src={MEDIA.landscape} videoStyle={{ borderRadius: 12 }} />
      </div>
    </Stage>
  )
}

/** The glow follows the container through CSS; no JavaScript resize handling is needed for layout size. */
export const ResponsiveContainer: Story = { render: () => <Responsive /> }

/** The same clip displayed at three CSS sizes. Blur is in CSS pixels, so smaller boxes get a proportionally softer glow. */
export const VideoDimensions: Story = {
  render: () => (
    <Stage width="100%">
      <div style={{ display: 'flex', gap: '5rem', alignItems: 'flex-start' }}>
        {[200, 360, 560].map((size) => (
          <div key={size} style={{ width: size }}>
            <VideoAmbilight
              {...VIDEO_PROPS}
              controls={false}
              src={MEDIA.landscape}
              blur={size / 6}
              videoStyle={{ borderRadius: 8 }}
            />
          </div>
        ))}
      </div>
    </Stage>
  ),
}

/** Several independent engines on one page. Each keeps its own buffer and clock. */
export const MultipleInstances: Story = {
  render: () => (
    <Stage width="100%">
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '4rem' }}>
        {Array.from({ length: 6 }, (_, i) => (
          <VideoAmbilight
            key={i}
            {...VIDEO_PROPS}
            controls={false}
            src={MEDIA.landscape}
            blur={50}
            videoStyle={{ borderRadius: 8 }}
          />
        ))}
      </div>
    </Stage>
  ),
}
