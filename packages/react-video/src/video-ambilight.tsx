import {
  forwardRef,
  useCallback,
  useEffect,
  useMemo,
  useRef,
  type CSSProperties,
  type Ref,
  type VideoHTMLAttributes,
} from 'react'
import { Ambilight } from '@videoglow/react'
import type { AmbilightHandle } from '@videoglow/react'
import type { Ambilight as AmbilightInstance, AmbilightOptionsInput } from '@videoglow/core'
import type { VideoSourceOptions } from '@videoglow/video'
import { useVideoSource } from './use-video-source'

export interface VideoAmbilightProps
  extends
    AmbilightOptionsInput,
    VideoSourceOptions,
    Omit<VideoHTMLAttributes<HTMLVideoElement>, 'className' | 'style' | 'children'> {
  /** Class name of the wrapper element. */
  readonly className?: string
  /** Style of the wrapper element. */
  readonly style?: CSSProperties
  readonly videoClassName?: string
  readonly videoStyle?: CSSProperties
  readonly glowClassName?: string
  /** Start rendering. Default true. */
  readonly enabled?: boolean
  /** Receives the engine instance, or null after unmount. */
  readonly ambilightRef?: Ref<AmbilightInstance | null>
}

const VIDEO_STYLE: CSSProperties = { display: 'block', width: '100%', height: 'auto' }

/**
 * A `<video>` with an Ambilight glow behind it. All video attributes are
 * forwarded to the element; the ref points at the `HTMLVideoElement`.
 */
export const VideoAmbilight = forwardRef<HTMLVideoElement, VideoAmbilightProps>(
  function VideoAmbilight(props, ref) {
    const {
      className,
      style,
      videoClassName,
      videoStyle,
      glowClassName,
      enabled,
      ambilightRef,
      videoFrameCallback,
      frameCallbackTimeoutMs,
      blur,
      opacity,
      saturation,
      brightness,
      scale,
      fps,
      resolution,
      pauseWhenHidden,
      pauseWhenOffscreen,
      ...videoProps
    } = props

    const [source, sourceRef] = useVideoSource({ videoFrameCallback, frameCallbackTimeoutMs })
    const handleRef = useRef<AmbilightHandle | null>(null)

    const videoRef = useCallback(
      (node: HTMLVideoElement | null) => {
        sourceRef(node)
        if (typeof ref === 'function') ref(node)
        else if (ref) ref.current = node
      },
      [ref, sourceRef]
    )

    const mergedVideoStyle = useMemo<CSSProperties>(
      () => ({ ...VIDEO_STYLE, ...videoStyle }),
      [videoStyle]
    )

    const setHandle = useCallback(
      (handle: AmbilightHandle | null) => {
        handleRef.current = handle
        const instance = handle?.getAmbilight() ?? null
        if (typeof ambilightRef === 'function') ambilightRef(instance)
        else if (ambilightRef) ambilightRef.current = instance
      },
      [ambilightRef]
    )

    useEffect(() => () => setHandle(null), [setHandle])

    return (
      <Ambilight
        ref={setHandle}
        source={source}
        enabled={enabled}
        className={className}
        style={style}
        glowClassName={glowClassName}
        blur={blur}
        opacity={opacity}
        saturation={saturation}
        brightness={brightness}
        scale={scale}
        fps={fps}
        resolution={resolution}
        pauseWhenHidden={pauseWhenHidden}
        pauseWhenOffscreen={pauseWhenOffscreen}
      >
        <video ref={videoRef} className={videoClassName} style={mergedVideoStyle} {...videoProps} />
      </Ambilight>
    )
  }
)
