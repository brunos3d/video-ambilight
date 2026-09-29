export interface FrameClock {
  /** Returns true when enough time passed since the last accepted frame. Records the frame when it does. */
  shouldRender(now: number): boolean
  setFps(fps: number): void
  getFps(): number
  /** Forget the last accepted frame so the next call renders. */
  reset(): void
}

/**
 * Fraction of the target interval that must elapse before a frame is accepted.
 * A 60 Hz loop capped at 30 fps therefore renders every second tick, and a
 * 30 fps video capped at 30 fps renders every frame despite timer jitter.
 */
const ACCEPT_RATIO = 0.75

export function createFrameClock(initialFps: number): FrameClock {
  let fps = normalize(initialFps)
  let last = Number.NEGATIVE_INFINITY

  return {
    shouldRender(now) {
      if (fps <= 0) return true
      const interval = 1000 / fps
      if (now - last < interval * ACCEPT_RATIO) return false
      last = now
      return true
    },
    setFps(next) {
      fps = normalize(next)
    },
    getFps: () => fps,
    reset() {
      last = Number.NEGATIVE_INFINITY
    },
  }
}

function normalize(fps: number): number {
  return Number.isFinite(fps) && fps > 0 ? fps : 0
}
