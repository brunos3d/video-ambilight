import { DemoHeader } from '@/components/demo-header'
import { PerformanceDemo } from '@/components/performance-demo'

export const metadata = { title: 'Performance' }

export default function PerformancePage() {
  return (
    <>
      <DemoHeader route="/performance" />
      <PerformanceDemo />
      <div className="panel">
        <h2>Reading the numbers</h2>
        <p>
          The measurable part of the pipeline is <code>drawImage</code> into the buffer. The blur
          runs on the compositor and is paid only when the glow layer changes, at most once per
          rendered frame. Main-thread cost therefore scales with buffer area and the fps cap, not
          with the video resolution or the blur radius. YouTube synchronization costs one{' '}
          <code>postMessage</code> round trip per drift check (one per second while playing).
        </p>
      </div>
    </>
  )
}
