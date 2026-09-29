import { createEmitter } from './emitter'
import { createAnimationFrameScheduler, defaultNow } from './environment'
import { createFrameClock } from './frame-clock'
import { prepareGlowContainer, resolveGlowStyle } from './glow-style'
import { DEFAULT_RESOLUTION } from './buffer-size'
import { createCanvasGlowRenderer } from './canvas-glow-renderer'
import { createVisibilityGate } from './visibility-gate'
import type {
  Ambilight,
  AmbilightEvent,
  AmbilightOptions,
  AmbilightOptionsInput,
  AmbilightState,
  Frame,
  FrameSource,
  FrameSourceEvent,
  GlowStyle,
  SamplingOptions,
  Unsubscribe,
} from './types'

export const DEFAULT_SAMPLING_OPTIONS: SamplingOptions = Object.freeze({
  fps: 30,
  resolution: DEFAULT_RESOLUTION,
  pauseWhenHidden: true,
  pauseWhenOffscreen: true,
})

export function resolveSamplingOptions(
  input: Partial<SamplingOptions> = {},
  base: SamplingOptions = DEFAULT_SAMPLING_OPTIONS
): SamplingOptions {
  return {
    fps:
      typeof input.fps === 'number' && Number.isFinite(input.fps) && input.fps >= 0
        ? input.fps
        : base.fps,
    resolution:
      typeof input.resolution === 'number' &&
      Number.isFinite(input.resolution) &&
      input.resolution > 0
        ? input.resolution
        : base.resolution,
    pauseWhenHidden: input.pauseWhenHidden ?? base.pauseWhenHidden,
    pauseWhenOffscreen: input.pauseWhenOffscreen ?? base.pauseWhenOffscreen,
  }
}

const AVERAGE_WINDOW = 60

/**
 * Creates the Ambilight engine: connects a frame source to a glow renderer,
 * paces sampling and manages the rendering lifecycle.
 */
export function createAmbilight(options: AmbilightOptions): Ambilight {
  const container = options.container
  const scheduler =
    options.scheduler ??
    createAnimationFrameScheduler(container.ownerDocument.defaultView ?? window)
  const now = options.now ?? defaultNow
  const renderer =
    options.renderer ?? createCanvasGlowRenderer({ document: container.ownerDocument })
  const emitter = createEmitter<AmbilightEvent>()
  const clock = createFrameClock(DEFAULT_SAMPLING_OPTIONS.fps)

  let style: GlowStyle = resolveGlowStyle(options)
  let sampling: SamplingOptions = resolveSamplingOptions(options)
  let source: FrameSource | null = null
  let unsubscribeSource: Unsubscribe | null = null
  let running = false
  let disposed = false
  let loopHandle: number | null = null

  let samplingState = false
  let framesRendered = 0
  let framesSkipped = 0
  let renderErrors = 0
  let lastRenderDurationMs = 0
  let durationSum = 0
  const durations: number[] = []

  applyOptions()
  mount()

  const gate = createVisibilityGate(
    renderer.element,
    { pauseWhenHidden: sampling.pauseWhenHidden, pauseWhenOffscreen: sampling.pauseWhenOffscreen },
    (visible) => {
      emitter.emit({ type: 'visibilitychange', visible })
      syncLoop()
      if (visible) renderCurrent()
    }
  )

  function mount(): void {
    prepareGlowContainer(container)
    if (renderer.element.parentNode !== container) {
      container.insertBefore(renderer.element, container.firstChild)
    }
  }

  function applyOptions(): void {
    renderer.setStyle(style)
    renderer.setResolution(sampling.resolution)
    clock.setFps(sampling.fps)
  }

  function recordDuration(duration: number): void {
    lastRenderDurationMs = duration
    durations.push(duration)
    durationSum += duration
    if (durations.length > AVERAGE_WINDOW) {
      durationSum -= durations.shift() ?? 0
    }
  }

  function render(frame: Frame): boolean {
    const started = now()
    try {
      renderer.render(frame)
    } catch (error) {
      renderErrors += 1
      emitter.emit({ type: 'error', error })
      return false
    }
    const duration = now() - started
    framesRendered += 1
    recordDuration(duration)
    emitter.emit({ type: 'render', durationMs: duration, frame })
    return true
  }

  function renderCurrent(): boolean {
    if (disposed || !source || !gate.isVisible()) return false
    const frame = source.getFrame()
    if (!frame) return false
    return render(frame)
  }

  function wantsLoop(): boolean {
    return (
      running &&
      !disposed &&
      source !== null &&
      source.mode === 'pull' &&
      source.isActive() &&
      gate.isVisible()
    )
  }

  function loop(time: number): void {
    loopHandle = null
    if (!wantsLoop()) return
    if (clock.shouldRender(time)) {
      renderCurrent()
    }
    loopHandle = scheduler.request(loop)
  }

  function syncLoop(): void {
    const wanted = wantsLoop()
    if (wanted && loopHandle === null) {
      clock.reset()
      loopHandle = scheduler.request(loop)
    } else if (!wanted && loopHandle !== null) {
      scheduler.cancel(loopHandle)
      loopHandle = null
    }
    refreshSampling()
  }

  function refreshSampling(): void {
    const next = isSampling()
    if (next === samplingState) return
    samplingState = next
    emitter.emit({ type: 'samplingchange', sampling: next })
  }

  function onPushedFrame(frame: Frame): void {
    if (!running || !gate.isVisible()) return
    if (!clock.shouldRender(now())) {
      framesSkipped += 1
      return
    }
    render(frame)
  }

  function handleSourceEvent(event: FrameSourceEvent): void {
    if (disposed) return
    switch (event.type) {
      case 'frame':
        onPushedFrame(event.frame)
        break
      case 'active':
        syncLoop()
        break
      case 'idle':
        syncLoop()
        break
      case 'invalidate':
      case 'resize':
        if (running) renderCurrent()
        break
      case 'clear':
        renderer.clear()
        break
    }
  }

  function attachSource(next: FrameSource | null): void {
    unsubscribeSource?.()
    unsubscribeSource = null
    source = next
    if (source && running) {
      unsubscribeSource = source.subscribe(handleSourceEvent)
    }
  }

  function isSampling(): boolean {
    if (!running || !source || !gate.isVisible() || !source.isActive()) return false
    return source.mode === 'push' || loopHandle !== null
  }

  const ambilight: Ambilight = {
    get element() {
      return renderer.element
    },
    renderer,
    start() {
      if (disposed || running) return
      running = true
      if (source) {
        unsubscribeSource = source.subscribe(handleSourceEvent)
      }
      clock.reset()
      emitter.emit({ type: 'start' })
      renderCurrent()
      syncLoop()
    },
    stop() {
      if (!running) return
      running = false
      unsubscribeSource?.()
      unsubscribeSource = null
      syncLoop()
      emitter.emit({ type: 'stop' })
    },
    renderOnce() {
      if (disposed || !source) return false
      const frame = source.getFrame()
      if (!frame) return false
      return render(frame)
    },
    update(input: AmbilightOptionsInput) {
      if (disposed) return
      style = resolveGlowStyle(input, style)
      sampling = resolveSamplingOptions(input, sampling)
      applyOptions()
      gate.update({
        pauseWhenHidden: sampling.pauseWhenHidden,
        pauseWhenOffscreen: sampling.pauseWhenOffscreen,
      })
      if (running) renderCurrent()
      syncLoop()
    },
    setSource(next) {
      if (disposed || next === source) return
      attachSource(next)
      emitter.emit({ type: 'sourcechange', source: next })
      if (!next) {
        renderer.clear()
      } else if (running) {
        clock.reset()
        renderCurrent()
      }
      syncLoop()
    },
    getSource: () => source,
    getOptions: () => ({ ...style, ...sampling }),
    getState(): AmbilightState {
      const buffer = renderer.getBufferSize()
      return {
        running,
        sampling: isSampling(),
        visible: gate.isVisible(),
        framesRendered,
        framesSkipped,
        renderErrors,
        lastRenderDurationMs,
        averageRenderDurationMs: durations.length ? durationSum / durations.length : 0,
        bufferWidth: buffer.width,
        bufferHeight: buffer.height,
        sourceKind: source?.kind ?? null,
        sourceMode: source?.mode ?? null,
      }
    },
    subscribe: (listener) => emitter.subscribe(listener),
    dispose() {
      if (disposed) return
      ambilight.stop()
      disposed = true
      gate.dispose()
      attachSource(null)
      renderer.dispose()
      emitter.emit({ type: 'dispose' })
      emitter.clear()
    },
  }

  if (options.source) {
    source = options.source
  }
  if (options.autoStart ?? true) {
    ambilight.start()
  }

  return ambilight
}
