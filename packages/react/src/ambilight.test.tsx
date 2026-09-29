import { createRef, StrictMode } from 'react'
import { act, render } from '@testing-library/react'
import { describe, expect, it } from 'vitest'
import { GLOW_DATA_ATTRIBUTE } from '@videoglow/core'
import { Ambilight, type AmbilightHandle } from './ambilight'
import { createTestSource } from './test-utils/fakes'

const glowSelector = `canvas[${GLOW_DATA_ATTRIBUTE}="glow"]`

describe('<Ambilight>', () => {
  it('renders children inside a positioned wrapper with the glow canvas first', () => {
    const source = createTestSource()
    const ref = createRef<AmbilightHandle>()
    const view = render(
      <Ambilight ref={ref} source={source} className="box" glowClassName="glow" data-testid="wrap">
        <video data-testid="video" />
      </Ambilight>
    )
    const wrapper = view.getByTestId('wrap')
    expect(wrapper.style.position).toBe('relative')
    expect(wrapper.className).toBe('box')
    const canvas = wrapper.querySelector(glowSelector)
    expect(canvas).not.toBeNull()
    expect(wrapper.firstElementChild).toBe(canvas)
    expect(canvas?.classList.contains('glow')).toBe(true)
    expect(wrapper.lastElementChild).toBe(view.getByTestId('video'))
    expect(ref.current?.getAmbilight()?.getState().running).toBe(true)
    expect(ref.current?.getAmbilight()?.getState().framesRendered).toBe(1)
  })

  it('applies option changes without recreating the engine', () => {
    const source = createTestSource()
    const ref = createRef<AmbilightHandle>()
    const view = render(<Ambilight ref={ref} source={source} blur={20} />)
    const engine = ref.current?.getAmbilight()
    expect(engine?.getOptions().blur).toBe(20)
    act(() => {
      view.rerender(<Ambilight ref={ref} source={source} blur={50} fps={10} />)
    })
    expect(ref.current?.getAmbilight()).toBe(engine)
    expect(engine?.getOptions()).toMatchObject({ blur: 50, fps: 10 })
  })

  it('swaps sources and stops when disabled', () => {
    const first = createTestSource()
    const second = createTestSource(320, 180)
    const ref = createRef<AmbilightHandle>()
    const view = render(<Ambilight ref={ref} source={first} />)
    expect(first.listenerCount).toBe(1)
    act(() => {
      view.rerender(<Ambilight ref={ref} source={second} />)
    })
    expect(first.listenerCount).toBe(0)
    expect(second.listenerCount).toBe(1)
    act(() => {
      view.rerender(<Ambilight ref={ref} source={second} enabled={false} />)
    })
    expect(ref.current?.getAmbilight()?.getState().running).toBe(false)
    expect(second.listenerCount).toBe(0)
  })

  it('disposes the engine on unmount and does not dispose the source', () => {
    const source = createTestSource()
    const ref = createRef<AmbilightHandle>()
    const view = render(<Ambilight ref={ref} source={source} />)
    const engine = ref.current?.getAmbilight()
    view.unmount()
    expect(engine?.getState().running).toBe(false)
    expect(source.listenerCount).toBe(0)
    expect(source.disposed).toBe(false)
    expect(document.querySelector(glowSelector)).toBeNull()
  })

  it('mounts a single glow canvas under Strict Mode', () => {
    const source = createTestSource()
    render(
      <StrictMode>
        <Ambilight source={source} data-testid="wrap">
          <span />
        </Ambilight>
      </StrictMode>
    )
    expect(document.querySelectorAll(glowSelector)).toHaveLength(1)
    expect(source.listenerCount).toBe(1)
  })
})
