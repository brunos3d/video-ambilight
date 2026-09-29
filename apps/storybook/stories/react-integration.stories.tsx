import { useState } from 'react'
import type { Meta, StoryObj } from '@storybook/react-vite'
import { Ambilight, useAmbilight, useFrameSource } from '@videoglow/react'
import { createVideoSource } from '@videoglow/video'
import { useVideoSource } from '@videoglow/react-video'
import { MEDIA, Readout, Stage, VIDEO_PROPS } from './fixtures'

const meta = {
  title: 'React/Integration',
} satisfies Meta

export default meta
type Story = StoryObj<typeof meta>

function ComponentComposition() {
  const [source, videoRef] = useVideoSource()
  return (
    <Stage>
      <Ambilight source={source} blur={70}>
        <video
          ref={videoRef}
          {...VIDEO_PROPS}
          src={MEDIA.landscape}
          style={{ display: 'block', width: '100%', borderRadius: 12 }}
        />
      </Ambilight>
    </Stage>
  )
}

/** `<Ambilight>` plus `useVideoSource`: you own the video element. */
export const AmbilightComponent: Story = { render: () => <ComponentComposition /> }

function HookComposition() {
  const [figure, setFigure] = useState<HTMLElement | null>(null)
  const [source, videoRef] = useFrameSource((video: HTMLVideoElement) => createVideoSource(video))
  const [enabled, setEnabled] = useState(true)
  const ambilight = useAmbilight({ container: figure, source, enabled, blur: 60, opacity: 0.6 })
  return (
    <Stage>
      <figure ref={setFigure} style={{ margin: 0 }}>
        <video
          ref={videoRef}
          {...VIDEO_PROPS}
          src={MEDIA.landscape}
          style={{ display: 'block', width: '100%', borderRadius: 12 }}
        />
        <figcaption style={{ color: '#9a9aa8', marginTop: 12, fontSize: 13 }}>
          The glow is mounted into this figure by the hook.
        </figcaption>
      </figure>
      <button type="button" onClick={() => setEnabled((e) => !e)} style={{ marginTop: '1rem' }}>
        {enabled ? 'Disable' : 'Enable'}
      </button>
      <Readout ambilight={ambilight} />
    </Stage>
  )
}

/** `useAmbilight` with your own markup and an enabled switch. */
export const Hooks: Story = { render: () => <HookComposition /> }

function Remounting() {
  const [key, setKey] = useState(0)
  const [visible, setVisible] = useState(true)
  return (
    <Stage>
      <div style={{ display: 'flex', gap: 8, marginBottom: '2rem' }}>
        <button type="button" onClick={() => setKey((k) => k + 1)}>
          Remount
        </button>
        <button type="button" onClick={() => setVisible((v) => !v)}>
          {visible ? 'Unmount' : 'Mount'}
        </button>
      </div>
      {visible ? <ComponentComposition key={key} /> : null}
    </Stage>
  )
}

/** Mount, unmount and remount repeatedly. Exactly one glow canvas exists while mounted. */
export const RepeatedMounting: Story = { render: () => <Remounting /> }
