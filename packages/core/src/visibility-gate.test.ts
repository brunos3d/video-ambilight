import { afterEach, describe, expect, it, vi } from 'vitest'
import { createVisibilityGate } from './visibility-gate'

function setHidden(hidden: boolean): void {
  Object.defineProperty(document, 'visibilityState', {
    configurable: true,
    get: () => (hidden ? 'hidden' : 'visible'),
  })
  document.dispatchEvent(new Event('visibilitychange'))
}

describe('createVisibilityGate', () => {
  afterEach(() => {
    setHidden(false)
    vi.unstubAllGlobals()
  })

  it('reports hidden documents when pauseWhenHidden is on', () => {
    const el = document.createElement('div')
    const changes: boolean[] = []
    const gate = createVisibilityGate(
      el,
      { pauseWhenHidden: true, pauseWhenOffscreen: false },
      (v) => changes.push(v)
    )
    expect(gate.isVisible()).toBe(true)
    setHidden(true)
    expect(gate.isVisible()).toBe(false)
    setHidden(false)
    expect(changes).toEqual([false, true])
    gate.dispose()
    setHidden(true)
    expect(changes).toEqual([false, true])
  })

  it('ignores document visibility when pauseWhenHidden is off', () => {
    const el = document.createElement('div')
    const gate = createVisibilityGate(
      el,
      { pauseWhenHidden: false, pauseWhenOffscreen: false },
      () => {}
    )
    setHidden(true)
    expect(gate.isVisible()).toBe(true)
    gate.dispose()
  })

  it('uses IntersectionObserver for offscreen detection and tears it down on update', () => {
    let callback: IntersectionObserverCallback | null = null
    const disconnect = vi.fn()
    const observe = vi.fn()
    class FakeIO {
      constructor(cb: IntersectionObserverCallback) {
        callback = cb
      }
      observe = observe
      disconnect = disconnect
      unobserve = vi.fn()
    }
    vi.stubGlobal('IntersectionObserver', FakeIO)

    const el = document.createElement('div')
    const changes: boolean[] = []
    const gate = createVisibilityGate(
      el,
      { pauseWhenHidden: false, pauseWhenOffscreen: true },
      (v) => changes.push(v)
    )
    expect(observe).toHaveBeenCalledWith(el)
    const fire = (isIntersecting: boolean) =>
      callback?.([{ isIntersecting } as IntersectionObserverEntry], {} as IntersectionObserver)
    fire(false)
    expect(gate.isVisible()).toBe(false)
    fire(true)
    expect(gate.isVisible()).toBe(true)
    fire(false)
    gate.update({ pauseWhenHidden: false, pauseWhenOffscreen: false })
    expect(disconnect).toHaveBeenCalled()
    expect(gate.isVisible()).toBe(true)
    expect(changes).toEqual([false, true, false, true])
    gate.dispose()
  })
})
