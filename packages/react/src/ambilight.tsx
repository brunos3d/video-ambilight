import {
  forwardRef,
  useCallback,
  useImperativeHandle,
  useMemo,
  useState,
  type CSSProperties,
  type HTMLAttributes,
  type ReactNode,
} from 'react'
import { createCanvasGlowRenderer } from '@videoglow/core'
import type {
  Ambilight as AmbilightInstance,
  AmbilightOptionsInput,
  FrameSource,
  GlowRenderer,
} from '@videoglow/core'
import { useAmbilight } from './use-ambilight'

export interface AmbilightProps
  extends AmbilightOptionsInput, Omit<HTMLAttributes<HTMLDivElement>, 'children'> {
  /** Frame source to render. Null renders nothing until a source is provided. */
  readonly source: FrameSource | null
  /** Start rendering. Default true. */
  readonly enabled?: boolean
  /** Class name applied to the glow canvas. */
  readonly glowClassName?: string
  /** Custom renderer factory. Overrides `glowClassName`. */
  readonly createRenderer?: () => GlowRenderer
  readonly children?: ReactNode
}

export interface AmbilightHandle {
  getAmbilight(): AmbilightInstance | null
  getElement(): HTMLDivElement | null
}

const WRAPPER_STYLE: CSSProperties = { position: 'relative', isolation: 'isolate' }

/**
 * Wraps children in a positioned box and renders the glow behind them.
 * The children (a video, a canvas) stay in normal flow and paint above the glow.
 */
export const Ambilight = forwardRef<AmbilightHandle, AmbilightProps>(
  function Ambilight(props, ref) {
    const {
      source,
      enabled,
      glowClassName,
      createRenderer,
      children,
      style,
      blur,
      opacity,
      saturation,
      brightness,
      scale,
      fps,
      resolution,
      pauseWhenHidden,
      pauseWhenOffscreen,
      ...rest
    } = props
    const [container, setContainer] = useState<HTMLDivElement | null>(null)

    const rendererFactory = useMemo(
      () => createRenderer ?? (() => createCanvasGlowRenderer({ className: glowClassName })),
      [createRenderer, glowClassName]
    )

    const ambilight = useAmbilight({
      container,
      source,
      enabled,
      createRenderer: rendererFactory,
      blur,
      opacity,
      saturation,
      brightness,
      scale,
      fps,
      resolution,
      pauseWhenHidden,
      pauseWhenOffscreen,
    })

    useImperativeHandle(
      ref,
      () => ({ getAmbilight: () => ambilight, getElement: () => container }),
      [ambilight, container]
    )

    const refCallback = useCallback((node: HTMLDivElement | null) => setContainer(node), [])
    const mergedStyle = useMemo<CSSProperties>(() => ({ ...WRAPPER_STYLE, ...style }), [style])

    return (
      <div ref={refCallback} data-videoglow="container" style={mergedStyle} {...rest}>
        {children}
      </div>
    )
  }
)
