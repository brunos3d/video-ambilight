import type { FrameSize } from './types'

export const DEFAULT_RESOLUTION = 160
export const MIN_BUFFER_EDGE = 2

/**
 * Backing store size for a frame: the long edge is capped at `resolution`,
 * the aspect ratio is preserved and each edge is at least 2 px.
 * Returns 0x0 for degenerate frames.
 */
export function resolveBufferSize(frame: FrameSize, resolution: number): FrameSize {
  const { width, height } = frame
  if (!(width > 0) || !(height > 0) || !Number.isFinite(width) || !Number.isFinite(height)) {
    return { width: 0, height: 0 }
  }
  const cap = Number.isFinite(resolution) && resolution > 0 ? resolution : DEFAULT_RESOLUTION
  const scale = Math.min(1, cap / Math.max(width, height))
  return {
    width: Math.max(MIN_BUFFER_EDGE, Math.round(width * scale)),
    height: Math.max(MIN_BUFFER_EDGE, Math.round(height * scale)),
  }
}

export function sameSize(a: FrameSize, b: FrameSize): boolean {
  return a.width === b.width && a.height === b.height
}
