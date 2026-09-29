import { CodeBlock } from '@/components/code-block'
import { DemoHeader } from '@/components/demo-header'
import { YouTubeDemo } from '@/components/youtube-demo'

const CODE = `
'use client'
import { YouTubeAmbilight } from '@videoglow/react-youtube'

export function Player() {
  return (
    <YouTubeAmbilight
      videoId="ASzOzrB-a9E"
      glow={{ blur: 80, opacity: 0.5, saturation: 3 }}
      sync={{ driftToleranceSeconds: 0.25, checkIntervalMs: 1000 }}
    />
  )
}
`

export default function YouTubePage() {
  return (
    <>
      <DemoHeader route="/youtube" />
      <YouTubeDemo />
      <CodeBlock title="Usage" code={CODE} />
      <div className="panel">
        <h2>How it works</h2>
        <p>
          Browsers never expose the pixels of a cross-origin iframe, so the glow is a second, muted
          YouTube player under a CSS filter. The visible player is the clock. The coordinator
          mirrors play, pause, buffering, ending and playback rate through events, and checks drift
          once per second while playing. A corrective seek is issued only when the drift exceeds the
          tolerance. The old implementation seeked on every animation frame.
        </p>
      </div>
    </>
  )
}
