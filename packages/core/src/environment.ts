import type { AnimationScheduler } from './types'

export function isBrowser(): boolean {
  return typeof window !== 'undefined' && typeof document !== 'undefined'
}

export function defaultNow(): number {
  if (typeof performance !== 'undefined' && typeof performance.now === 'function') {
    return performance.now()
  }
  return Date.now()
}

/** `requestAnimationFrame` behind the `AnimationScheduler` interface. */
export function createAnimationFrameScheduler(target: Window = window): AnimationScheduler {
  return {
    request: (callback) => target.requestAnimationFrame(callback),
    cancel: (handle) => target.cancelAnimationFrame(handle),
  }
}

/** Scheduler backed by `setTimeout`, for environments without animation frames. */
export function createTimeoutScheduler(
  intervalMs = 16,
  now: () => number = defaultNow
): AnimationScheduler {
  return {
    request: (callback) => setTimeout(() => callback(now()), intervalMs) as unknown as number,
    cancel: (handle) => clearTimeout(handle as unknown as ReturnType<typeof setTimeout>),
  }
}
