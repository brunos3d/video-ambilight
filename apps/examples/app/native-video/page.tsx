import { CodeBlock } from '@/components/code-block'
import { DemoHeader } from '@/components/demo-header'
import { NativeVideoDemo } from '@/components/native-video-demo'

const CODE = `
'use client'
import { VideoAmbilight } from '@videoglow/react-video'

export const metadata = {
  title: 'Native video',
  alternates: { canonical: '/native-video' },
}

export function Player() {
  return <VideoAmbilight src="/media/clip.webm" controls muted loop autoPlay playsInline blur={80} />
}
`

export default function NativeVideoPage() {
  return (
    <>
      <DemoHeader route="/native-video" />
      <NativeVideoDemo />
      <CodeBlock title="Usage" code={CODE} />
      <div className="panel">
        <h2>What to look for</h2>
        <p>
          Play, pause and seek with the controls. Frames arrive through{' '}
          <code>requestVideoFrameCallback</code> (push mode) and the fps cap of 30 skips extra
          frames. Pausing stops sampling; seeking while paused renders once. Switch tabs and the
          counter stops.
        </p>
      </div>
    </>
  )
}
