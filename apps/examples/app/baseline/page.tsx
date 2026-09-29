import { DemoHeader } from '@/components/demo-header'
import { BaselineDemo } from '@/components/baseline-demo'

export const metadata = { title: 'Baseline comparison' }

export default function BaselinePage() {
  return (
    <>
      <DemoHeader route="/baseline" />
      <BaselineDemo />
      <div className="panel">
        <h2>Why this page exists</h2>
        <p>
          Both columns play the same clip with the same CSS filter. The left column draws every
          frame at the video's native resolution on a 30 fps timer, the way the first demo did. The
          right column draws into a 160 px buffer only when the browser presents a new frame. The
          Playwright suite screenshots both and asserts they match within a small tolerance.
        </p>
      </div>
    </>
  )
}
