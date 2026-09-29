import { StrictMode } from 'react'
import { act, render } from '@testing-library/react'
import { describe, expect, it, vi } from 'vitest'
import { useFrameSource } from './use-frame-source'
import { createTestSource, type TestSource } from './test-utils/fakes'

function Harness({
  onSource,
  factory,
  dep = 0,
}: {
  onSource: (s: TestSource | null) => void
  factory: (el: HTMLDivElement) => TestSource
  dep?: number
}) {
  const [source, ref] = useFrameSource<HTMLDivElement, TestSource>(factory, [dep])
  onSource(source)
  return <div ref={ref} />
}

describe('useFrameSource', () => {
  it('creates the source after mount and disposes it on unmount', () => {
    const created: TestSource[] = []
    const factory = vi.fn((_el: HTMLDivElement) => {
      const source = createTestSource()
      created.push(source)
      return source
    })
    const seen: Array<TestSource | null> = []
    const view = render(<Harness onSource={(s) => seen.push(s)} factory={factory} />)
    expect(seen[0]).toBeNull()
    expect(seen.at(-1)).toBe(created[0])
    expect(factory).toHaveBeenCalledTimes(1)
    view.unmount()
    expect(created[0]?.disposed).toBe(true)
  })

  it('leaves exactly one live source under Strict Mode', () => {
    const created: TestSource[] = []
    const factory = (_el: HTMLDivElement) => {
      const source = createTestSource()
      created.push(source)
      return source
    }
    const seen: Array<TestSource | null> = []
    render(
      <StrictMode>
        <Harness onSource={(s) => seen.push(s)} factory={factory} />
      </StrictMode>
    )
    const live = created.filter((s) => !s.disposed)
    expect(live).toHaveLength(1)
    expect(seen.at(-1)).toBe(live[0])
  })

  it('recreates the source when dependencies change', () => {
    const created: TestSource[] = []
    const factory = (_el: HTMLDivElement) => {
      const source = createTestSource()
      created.push(source)
      return source
    }
    const view = render(<Harness onSource={() => {}} factory={factory} dep={1} />)
    act(() => {
      view.rerender(<Harness onSource={() => {}} factory={factory} dep={2} />)
    })
    expect(created).toHaveLength(2)
    expect(created[0]?.disposed).toBe(true)
    expect(created[1]?.disposed).toBe(false)
  })
})
