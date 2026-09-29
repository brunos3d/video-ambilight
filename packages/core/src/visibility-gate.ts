export interface VisibilityGateOptions {
  readonly pauseWhenHidden: boolean
  readonly pauseWhenOffscreen: boolean
}

export interface VisibilityGate {
  isVisible(): boolean
  update(options: VisibilityGateOptions): void
  dispose(): void
}

/**
 * Tracks whether rendering into `element` can be seen: the document is
 * visible and the element intersects the viewport.
 */
export function createVisibilityGate(
  element: Element,
  initial: VisibilityGateOptions,
  onChange: (visible: boolean) => void
): VisibilityGate {
  const doc = element.ownerDocument
  let options = initial
  let documentHidden = doc.visibilityState === 'hidden'
  let offscreen = false
  let observer: IntersectionObserver | null = null
  let lastVisible = compute()

  function compute(): boolean {
    if (options.pauseWhenHidden && documentHidden) return false
    if (options.pauseWhenOffscreen && offscreen) return false
    return true
  }

  function notify(): void {
    const visible = compute()
    if (visible !== lastVisible) {
      lastVisible = visible
      onChange(visible)
    }
  }

  function onVisibilityChange(): void {
    documentHidden = doc.visibilityState === 'hidden'
    notify()
  }

  function syncObserver(): void {
    const wanted = options.pauseWhenOffscreen && typeof IntersectionObserver === 'function'
    if (wanted && !observer) {
      observer = new IntersectionObserver((entries) => {
        const entry = entries[entries.length - 1]
        if (!entry) return
        offscreen = !entry.isIntersecting
        notify()
      })
      observer.observe(element)
    } else if (!wanted && observer) {
      observer.disconnect()
      observer = null
      offscreen = false
      notify()
    }
  }

  doc.addEventListener('visibilitychange', onVisibilityChange)
  syncObserver()

  return {
    isVisible: () => lastVisible,
    update(next) {
      options = next
      syncObserver()
      notify()
    },
    dispose() {
      doc.removeEventListener('visibilitychange', onVisibilityChange)
      observer?.disconnect()
      observer = null
    },
  }
}
