import { act, render } from '@testing-library/react'
import { describe, expect, it } from 'vitest'
import type { Ambilight } from '@videoglow/core'
import { useAmbilight } from './use-ambilight'
import { useAmbilightState } from './use-ambilight-state'
import { createTestSource, type TestSource } from './test-utils/fakes'

function Panel({
  source,
  report,
}: {
  source: TestSource
  report: (frames: number, instance: Ambilight | null) => void
}) {
  const [container, setContainer] = useState<HTMLDivElement | null>(null)
  const ambilight = useAmbilight({ container, source, pauseWhenOffscreen: false })
  const state = useAmbilightState(ambilight)
  report(state.framesRendered, ambilight)
  return <div ref={setContainer} />
}

import { useState } from 'react'

describe('useAmbilightState', () => {
  it('reflects engine statistics as they change', () => {
    const source = createTestSource()
    const seen = { frames: -1 }
    render(<Panel source={source} report={(f) => void (seen.frames = f)} />)
    expect(seen.frames).toBe(1)
    act(() => {
      source.emit({ type: 'invalidate' })
      source.emit({ type: 'invalidate' })
    })
    expect(seen.frames).toBe(3)
  })

  it('returns an idle snapshot without an engine', () => {
    function Idle() {
      const state = useAmbilightState(null)
      return <span>{state.framesRendered}</span>
    }
    const view = render(<Idle />)
    expect(view.container.textContent).toBe('0')
  })
})
