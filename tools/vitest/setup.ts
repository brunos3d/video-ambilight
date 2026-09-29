// jsdom has no canvas implementation. Provide a minimal 2D context so renderer code can run.
// Tests that need real pixels run in Playwright (apps/examples-e2e).

interface FakeContext2D {
  drawImage: (...args: unknown[]) => void
  clearRect: (...args: unknown[]) => void
  fillRect: (...args: unknown[]) => void
  imageSmoothingEnabled: boolean
  imageSmoothingQuality: string
  calls: { method: string; args: unknown[] }[]
}

function createFakeContext(): FakeContext2D {
  const calls: FakeContext2D['calls'] = []
  return {
    calls,
    imageSmoothingEnabled: true,
    imageSmoothingQuality: 'low',
    drawImage: (...args) => calls.push({ method: 'drawImage', args }),
    clearRect: (...args) => calls.push({ method: 'clearRect', args }),
    fillRect: (...args) => calls.push({ method: 'fillRect', args }),
  }
}

const contexts = new WeakMap<HTMLCanvasElement, FakeContext2D>()

Object.defineProperty(HTMLCanvasElement.prototype, 'getContext', {
  configurable: true,
  writable: true,
  value: function getContext(this: HTMLCanvasElement, kind: string) {
    if (kind !== '2d') return null
    let ctx = contexts.get(this)
    if (!ctx) {
      ctx = createFakeContext()
      contexts.set(this, ctx)
    }
    return ctx
  },
})

if (typeof globalThis.ResizeObserver === 'undefined') {
  class ResizeObserverStub {
    observe(): void {}
    unobserve(): void {}
    disconnect(): void {}
  }
  Object.defineProperty(globalThis, 'ResizeObserver', {
    value: ResizeObserverStub,
    configurable: true,
  })
}

// React Testing Library needs this flag to silence "not wrapped in act" warnings under React 18/19.
Object.defineProperty(globalThis, 'IS_REACT_ACT_ENVIRONMENT', {
  value: true,
  configurable: true,
  writable: true,
})
