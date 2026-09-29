/**
 * Anything `CanvasRenderingContext2D.drawImage` accepts as a frame.
 */
export type FrameImage =
  | HTMLVideoElement
  | HTMLCanvasElement
  | OffscreenCanvas
  | ImageBitmap
  | HTMLImageElement
  | VideoFrame

export interface FrameSize {
  readonly width: number
  readonly height: number
}

/** One drawable frame plus its intrinsic size in media pixels. */
export interface Frame extends FrameSize {
  readonly image: FrameImage
  /** Media time in seconds when known (video sources). */
  readonly time?: number
}

/**
 * `push` sources announce every presented frame (`frame` events).
 * `pull` sources have no frame notification; the engine samples them on its own clock while active.
 */
export type FrameSourceMode = 'push' | 'pull'

export type FrameSourceEvent =
  /** A new frame was presented (push sources only). */
  | { readonly type: 'frame'; readonly frame: Frame }
  /** Continuous sampling is wanted from now on (playing). */
  | { readonly type: 'active' }
  /** Continuous sampling can stop (paused, ended, stalled). */
  | { readonly type: 'idle' }
  /** The current frame changed while idle (seek, manual draw). Render once. */
  | { readonly type: 'invalidate' }
  /** Intrinsic dimensions changed. */
  | { readonly type: 'resize'; readonly size: FrameSize }
  /** The source has no content anymore (media unloaded). Clear the glow. */
  | { readonly type: 'clear' }

export type Unsubscribe = () => void

export type Listener<T> = (event: T) => void

/**
 * A media object the engine can sample. Implementations live in
 * `@videoglow/video`, `@videoglow/canvas` and consumer code.
 */
export interface FrameSource {
  /** Identifies the implementation, for diagnostics ("video", "canvas", ...). */
  readonly kind: string
  readonly mode: FrameSourceMode
  /** The current drawable frame, or null when nothing can be drawn yet. */
  getFrame(): Frame | null
  /** Whether the source wants continuous sampling right now. */
  isActive(): boolean
  subscribe(listener: Listener<FrameSourceEvent>): Unsubscribe
  /** Release listeners and platform resources. The engine calls this only for sources it owns. */
  dispose(): void
}

/** Visual parameters of the glow. All values are absolute (not percentages). */
export interface GlowStyle {
  /** CSS blur radius in pixels. */
  readonly blur: number
  /** 0..1 opacity of the glow layer. */
  readonly opacity: number
  /** Saturation multiplier (1 = unchanged, 3 = 300%). */
  readonly saturation: number
  /** Brightness multiplier (1 = unchanged). */
  readonly brightness: number
  /** Scale of the glow layer relative to the source box. 1.15 spills 15% past each edge. */
  readonly scale: number
}

export type GlowStyleOptions = Partial<GlowStyle>

export interface SamplingOptions {
  /** Maximum frames per second sampled from the source. 0 disables the cap. */
  readonly fps: number
  /** Long edge of the internal render buffer in pixels. */
  readonly resolution: number
  /** Skip sampling while `document.visibilityState` is hidden. */
  readonly pauseWhenHidden: boolean
  /** Skip sampling while the glow element does not intersect the viewport. */
  readonly pauseWhenOffscreen: boolean
}

export type SamplingOptionsInput = Partial<SamplingOptions>

export type AmbilightOptionsInput = GlowStyleOptions & SamplingOptionsInput

/**
 * Turns frames into a visible glow. The default implementation draws into a
 * small canvas and blurs it with CSS. A WebGL renderer would implement the
 * same interface.
 */
export interface GlowRenderer {
  /** The DOM node that displays the glow. The engine mounts it into the container. */
  readonly element: HTMLElement
  render(frame: Frame): void
  setStyle(style: GlowStyle): void
  setResolution(resolution: number): void
  /** Current backing store size. */
  getBufferSize(): FrameSize
  clear(): void
  dispose(): void
}

/** Injectable animation frame scheduler (tests, custom loops). */
export interface AnimationScheduler {
  request(callback: (time: number) => void): number
  cancel(handle: number): void
}

export interface AmbilightOptions extends AmbilightOptionsInput {
  /** Initial source. May be null and set later with `setSource`. */
  readonly source?: FrameSource | null
  /** Element that receives the glow element as its first child. Must be positioned; `static` is upgraded to `relative`. */
  readonly container: HTMLElement
  /** Custom renderer. Defaults to `createCanvasGlowRenderer()`. */
  readonly renderer?: GlowRenderer
  /** Call `start()` immediately. Default true. */
  readonly autoStart?: boolean
  readonly scheduler?: AnimationScheduler
  /** Clock used for frame pacing and timing statistics. Defaults to `performance.now`. */
  readonly now?: () => number
}

export interface AmbilightState {
  readonly running: boolean
  /** Whether frames are currently being sampled (running, source active, visible). */
  readonly sampling: boolean
  readonly visible: boolean
  readonly framesRendered: number
  /** Frames offered by a push source but skipped by the fps cap. */
  readonly framesSkipped: number
  readonly renderErrors: number
  readonly lastRenderDurationMs: number
  readonly averageRenderDurationMs: number
  readonly bufferWidth: number
  readonly bufferHeight: number
  readonly sourceKind: string | null
  readonly sourceMode: FrameSourceMode | null
}

export type AmbilightEvent =
  | { readonly type: 'start' }
  | { readonly type: 'stop' }
  | { readonly type: 'render'; readonly durationMs: number; readonly frame: Frame }
  | { readonly type: 'sourcechange'; readonly source: FrameSource | null }
  | { readonly type: 'visibilitychange'; readonly visible: boolean }
  /** Sampling started or stopped (source active state, visibility, start/stop). */
  | { readonly type: 'samplingchange'; readonly sampling: boolean }
  | { readonly type: 'error'; readonly error: unknown }
  | { readonly type: 'dispose' }

export interface Ambilight {
  /** The glow element (owned by the renderer). */
  readonly element: HTMLElement
  readonly renderer: GlowRenderer
  start(): void
  stop(): void
  /** Draw the current frame immediately, ignoring the fps cap. Returns false when no frame is available. */
  renderOnce(): boolean
  update(options: AmbilightOptionsInput): void
  setSource(source: FrameSource | null): void
  getSource(): FrameSource | null
  getOptions(): Readonly<GlowStyle & SamplingOptions>
  getState(): AmbilightState
  subscribe(listener: Listener<AmbilightEvent>): Unsubscribe
  /** Stops, unmounts the glow element and disposes the renderer. Does not dispose the source. */
  dispose(): void
}
