import { useState } from 'react'
import type { Meta, StoryObj } from '@storybook/react-vite'
import { YouTubeAmbilight, type YouTubeAmbilightProps } from '@videoglow/react-youtube'
import type { CoordinatorEvent } from '@videoglow/youtube'
import { Stage, YOUTUBE_VIDEO_ID } from './fixtures'

function Demo(props: YouTubeAmbilightProps) {
  const [log, setLog] = useState<string[]>([])
  const onEvent = (event: CoordinatorEvent) =>
    setLog((l) => [JSON.stringify(event), ...l].slice(0, 8))
  return (
    <Stage>
      <YouTubeAmbilight {...props} onCoordinatorEvent={onEvent} />
      <pre style={{ color: '#9a9aa8', fontSize: 12, marginTop: '1.5rem' }}>
        {log.join('\n') || 'coordinator events appear here'}
      </pre>
    </Stage>
  )
}

const meta = {
  title: 'Sources/YouTube',
  component: Demo,
  args: {
    videoId: YOUTUBE_VIDEO_ID,
    glow: { blur: 80, opacity: 0.5, saturation: 3, scale: 1.2 },
    sync: { driftToleranceSeconds: 0.25, checkIntervalMs: 1000 },
  },
  parameters: {
    docs: {
      description: {
        component:
          'Requires network access to youtube.com. The glow is a second, muted player under a CSS filter, kept aligned by the playback coordinator.',
      },
    },
  },
} satisfies Meta<typeof Demo>

export default meta
type Story = StoryObj<typeof meta>

export const Basic: Story = {}

/** A tighter drift policy: corrections every 500 ms when drift exceeds 0.1 s. */
export const TightSync: Story = {
  args: { sync: { driftToleranceSeconds: 0.1, checkIntervalMs: 500 } },
}
