import { DemoHeader } from '@/components/demo-header'
import { ConfigurationDemo } from '@/components/configuration-demo'

export default function ConfigurationPage() {
  return (
    <>
      <DemoHeader route="/configuration" />
      <ConfigurationDemo />
      <div className="panel">
        <h2>Notes</h2>
        <p>
          Style values (blur, opacity, saturation, brightness, scale) are CSS on the glow layer and
          cost nothing per frame. Buffer resolution is the long edge of the internal canvas; 160 px
          is visually indistinguishable from full resolution under an 80 px blur. The fps cap bounds
          sampling regardless of the video frame rate.
        </p>
      </div>
    </>
  )
}
