import { applyGlowLayerLayout, applyGlowStyle, DEFAULT_GLOW_STYLE } from './glow-style'
import { DEFAULT_RESOLUTION, resolveBufferSize, sameSize } from './buffer-size'
import type { Frame, FrameSize, GlowRenderer, GlowStyle } from './types'

export interface CanvasGlowRendererOptions {
  /** Reuse an existing canvas instead of creating one. */
  readonly canvas?: HTMLCanvasElement
  readonly document?: Document
  /** Extra class name for styling hooks. */
  readonly className?: string
}

export const GLOW_DATA_ATTRIBUTE = 'data-videoglow'

/**
 * Draws each frame into a small canvas and lets CSS `filter` do the blur on
 * the compositor. Pixels are never read back, so cross-origin media without
 * CORS headers still works.
 */
export function createCanvasGlowRenderer(options: CanvasGlowRendererOptions = {}): GlowRenderer {
  const doc = options.document ?? options.canvas?.ownerDocument ?? document
  const canvas = options.canvas ?? doc.createElement('canvas')
  // Never request a desynchronized context here. A desynchronized canvas can be
  // scanned out through a hardware overlay plane, bypassing the compositor that
  // applies the CSS blur: the raw, unblurred canvas then shows on screen out of
  // sync with the glow, while screenshots (read from the compositor) look fine.
  const maybeContext = canvas.getContext('2d', { alpha: true })
  if (!maybeContext) {
    throw new Error('@videoglow/core: 2D canvas context is not available')
  }
  const context: CanvasRenderingContext2D = maybeContext

  canvas.setAttribute(GLOW_DATA_ATTRIBUTE, 'glow')
  canvas.setAttribute('aria-hidden', 'true')
  if (options.className) canvas.classList.add(options.className)
  applyGlowLayerLayout(canvas)

  let resolution = DEFAULT_RESOLUTION
  let buffer: FrameSize = { width: 0, height: 0 }
  let disposed = false

  function ensureBuffer(frame: Frame): boolean {
    const wanted = resolveBufferSize(frame, resolution)
    if (wanted.width === 0) return false
    if (
      !sameSize(wanted, buffer) ||
      canvas.width !== wanted.width ||
      canvas.height !== wanted.height
    ) {
      canvas.width = wanted.width
      canvas.height = wanted.height
      buffer = wanted
      // Resizing resets context state.
      context.imageSmoothingEnabled = true
      context.imageSmoothingQuality = 'low'
    }
    return true
  }

  const renderer: GlowRenderer = {
    element: canvas,
    render(frame) {
      if (disposed || !ensureBuffer(frame)) return
      context.drawImage(frame.image, 0, 0, buffer.width, buffer.height)
    },
    setStyle(style: GlowStyle) {
      applyGlowStyle(canvas, style)
    },
    setResolution(next) {
      resolution = Number.isFinite(next) && next > 0 ? next : DEFAULT_RESOLUTION
      // Force a buffer resize on the next frame.
      buffer = { width: 0, height: 0 }
    },
    getBufferSize: () => buffer,
    clear() {
      if (buffer.width > 0) context.clearRect(0, 0, buffer.width, buffer.height)
    },
    dispose() {
      disposed = true
      renderer.clear()
      canvas.remove()
    },
  }

  renderer.setStyle(DEFAULT_GLOW_STYLE)
  return renderer
}
