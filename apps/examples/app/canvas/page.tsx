import { CodeBlock } from '@/components/code-block'
import { DemoHeader } from '@/components/demo-header'
import { CanvasDemo } from '@/components/canvas-demo'

const CODE = `
'use client'
import { createCanvasSource } from '@videoglow/canvas'
import { Ambilight, useFrameSource } from '@videoglow/react'

export function Visualizer() {
  const [source, ref] = useFrameSource((el: HTMLCanvasElement) => createCanvasSource(el, { mode: 'continuous' }))
  return (
    <Ambilight source={source} blur={70}>
      <canvas ref={ref} width={640} height={360} />
    </Ambilight>
  )
}
`

export default function CanvasPage() {
  return (
    <>
      <DemoHeader route="/canvas" />
      <CanvasDemo />
      <CodeBlock title="Usage" code={CODE} />
      <div className="panel">
        <h2>Modes</h2>
        <p>
          <code>continuous</code> sources are sampled on the animation loop while active (pause the
          animation and the engine stops sampling). <code>manual</code> sources render only when you
          call <code>invalidate()</code>, which is right for charts and static scenes.
        </p>
      </div>
    </>
  )
}
