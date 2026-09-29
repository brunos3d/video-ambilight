import { CodeBlock } from '@/components/code-block'
import { DemoHeader } from '@/components/demo-header'
import { ReactHooksDemo } from '@/components/react-demo'

const CODE = `
'use client'
import { useState } from 'react'
import { useAmbilight, useFrameSource } from '@videoglow/react'
import { createVideoSource } from '@videoglow/video'

export const metadata = {
  title: 'React hooks',
  alternates: { canonical: '/react' },
}

export function Figure() {
  const [figure, setFigure] = useState<HTMLElement | null>(null)
  const [source, videoRef] = useFrameSource((video: HTMLVideoElement) => createVideoSource(video))
  useAmbilight({ container: figure, source, blur: 60 })
  return (
    <figure ref={setFigure}>
      <video ref={videoRef} src="/media/clip.webm" controls muted loop />
      <figcaption>Your caption</figcaption>
    </figure>
  )
}
`

export default function ReactPage() {
  return (
    <>
      <DemoHeader route="/react" />
      <ReactHooksDemo />
      <CodeBlock title="Usage" code={CODE} />
      <div className="panel">
        <h2>Lifecycle</h2>
        <p>
          <code>useFrameSource</code> creates the source after the element mounts and disposes it on
          unmount. <code>useAmbilight</code> owns the engine and recreates it only when the
          container or source changes; option changes go through <code>update()</code>. Both behave
          under Strict Mode: the double effect run leaves one live instance.
        </p>
      </div>
    </>
  )
}
