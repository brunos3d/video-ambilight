import { CodeBlock } from '@/components/code-block'
import { DemoHeader } from '@/components/demo-header'
import { CoreDemo } from '@/components/core-demo'

const CODE = `
import { createAmbilight } from '@videoglow/core'
import { createVideoSource } from '@videoglow/video'

export const metadata = { title: 'Core without React' }

const video = document.querySelector('video')
const container = video.parentElement // positioned box around the video

const source = createVideoSource(video)
const ambilight = createAmbilight({ container, source, blur: 90 })

// later
ambilight.update({ blur: 40 })
ambilight.dispose()
source.dispose()
`

export default function CorePage() {
  return (
    <>
      <DemoHeader route="/core" />
      <CoreDemo />
      <CodeBlock title="Usage" code={CODE} />
      <div className="panel">
        <h2>Contract</h2>
        <p>
          The engine mounts a canvas as the first child of the container, makes the container a
          positioned, isolated stacking context, and draws frames from any <code>FrameSource</code>.
          It never reads pixels back, so cross-origin video without CORS headers works. Dispose the
          engine and the source explicitly.
        </p>
      </div>
    </>
  )
}
