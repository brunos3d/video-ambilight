import type { GlowStyle, GlowStyleOptions } from './types'

/** Visual defaults, matching the original video-ambilight demos. */
export const DEFAULT_GLOW_STYLE: GlowStyle = Object.freeze({
  blur: 80,
  opacity: 0.5,
  saturation: 3,
  brightness: 1,
  scale: 1.15,
})

function finiteOr(value: number | undefined, fallback: number, min: number): number {
  if (typeof value !== 'number' || !Number.isFinite(value)) return fallback
  return Math.max(min, value)
}

export function resolveGlowStyle(
  options: GlowStyleOptions = {},
  base: GlowStyle = DEFAULT_GLOW_STYLE
): GlowStyle {
  return {
    blur: finiteOr(options.blur, base.blur, 0),
    opacity: Math.min(1, finiteOr(options.opacity, base.opacity, 0)),
    saturation: finiteOr(options.saturation, base.saturation, 0),
    brightness: finiteOr(options.brightness, base.brightness, 0),
    scale: finiteOr(options.scale, base.scale, 0),
  }
}

export interface GlowCss {
  readonly filter: string
  readonly transform: string
}

/** CSS declarations that turn a layer into the glow. Works on canvases and iframes alike. */
export function glowStyleToCss(style: GlowStyle): GlowCss {
  const filters = [
    `blur(${style.blur}px)`,
    `opacity(${style.opacity})`,
    `saturate(${style.saturation})`,
  ]
  if (style.brightness !== 1) filters.push(`brightness(${style.brightness})`)
  return {
    filter: filters.join(' '),
    // translateZ(0) promotes the layer to the compositor so the blur is not repainted on the main thread.
    transform: `scale(${style.scale}) translateZ(0)`,
  }
}

/**
 * Base layout for a glow layer: covers its positioned parent, paints below the
 * parent's in-flow children (`z-index: -1` inside the parent's stacking
 * context) and never receives input.
 */
export const GLOW_LAYER_CSS: Readonly<Record<string, string>> = Object.freeze({
  position: 'absolute',
  top: '0',
  left: '0',
  width: '100%',
  height: '100%',
  zIndex: '-1',
  pointerEvents: 'none',
  display: 'block',
})

/**
 * Prepares a container for a glow layer: positioned, and an isolated stacking
 * context so the layer's negative z-index stays inside the container.
 */
export function prepareGlowContainer(container: HTMLElement): void {
  const view = container.ownerDocument.defaultView
  const computed = view ? view.getComputedStyle(container) : null
  const position = computed?.position ?? ''
  if (!position || position === 'static') container.style.position = 'relative'
  const isolation = computed?.isolation ?? ''
  if (!isolation || isolation === 'auto') container.style.isolation = 'isolate'
}

export function applyGlowStyle(element: HTMLElement, style: GlowStyle): void {
  const css = glowStyleToCss(style)
  element.style.filter = css.filter
  element.style.transform = css.transform
}

export function applyGlowLayerLayout(element: HTMLElement): void {
  for (const [property, value] of Object.entries(GLOW_LAYER_CSS)) {
    element.style.setProperty(toKebab(property), value)
  }
}

function toKebab(property: string): string {
  return property.replace(/[A-Z]/g, (char) => `-${char.toLowerCase()}`)
}
