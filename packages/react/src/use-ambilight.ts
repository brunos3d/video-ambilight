import { useEffect } from 'react'
import { createAmbilight } from '@videoglow/core'
import type { Ambilight, AmbilightOptionsInput, FrameSource, GlowRenderer } from '@videoglow/core'
import { resolveElement, type ElementInput } from './element-input'
import { useLatest } from './use-latest'
import { useOwnedResource } from './use-owned-resource'

export interface UseAmbilightOptions extends AmbilightOptionsInput {
  /**
   * The positioned element that receives the glow layer. A ref object is read
   * when the effect runs; pass an element held in state when it can change.
   */
  readonly container: ElementInput<HTMLElement>
  readonly source: FrameSource | null
  /** Start rendering. Default true. */
  readonly enabled?: boolean
  /** Custom renderer factory. A new renderer is created with each engine instance. */
  readonly createRenderer?: () => GlowRenderer
}

const OPTION_KEYS = [
  'blur',
  'opacity',
  'saturation',
  'brightness',
  'scale',
  'fps',
  'resolution',
  'pauseWhenHidden',
  'pauseWhenOffscreen',
] as const

function pickOptions(options: AmbilightOptionsInput): AmbilightOptionsInput {
  const picked: Record<string, unknown> = {}
  for (const key of OPTION_KEYS) {
    if (options[key] !== undefined) picked[key] = options[key]
  }
  return picked as AmbilightOptionsInput
}

/**
 * Owns an Ambilight engine for the lifetime of the component. The engine is
 * recreated only when the container, the source or the renderer factory
 * change; every other option is applied with `update()`.
 */
export function useAmbilight(options: UseAmbilightOptions): Ambilight | null {
  const { container, source, enabled = true, createRenderer } = options
  const latest = useLatest(options)

  const instance = useOwnedResource<Ambilight>(
    () => {
      const element = resolveElement(container)
      if (!element) return null
      return createAmbilight({
        container: element,
        source,
        renderer: createRenderer?.(),
        autoStart: false,
        ...pickOptions(latest.current),
      })
    },
    (ambilight) => ambilight.dispose(),
    [container, source, createRenderer]
  )

  const {
    blur,
    opacity,
    saturation,
    brightness,
    scale,
    fps,
    resolution,
    pauseWhenHidden,
    pauseWhenOffscreen,
  } = options
  useEffect(() => {
    instance?.update(pickOptions(latest.current))
  }, [
    instance,
    latest,
    blur,
    opacity,
    saturation,
    brightness,
    scale,
    fps,
    resolution,
    pauseWhenHidden,
    pauseWhenOffscreen,
  ])

  useEffect(() => {
    if (!instance) return
    if (enabled) instance.start()
    else instance.stop()
  }, [instance, enabled])

  return instance
}
