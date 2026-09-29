import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { createAmbilight, resolveSamplingOptions, DEFAULT_SAMPLING_OPTIONS } from './ambilight'
import type { AmbilightEvent } from './types'
import {
  createClock,
  createFakeFrame,
  createFakeSource,
  createManualScheduler,
  createStubRenderer,
} from './test-utils/fakes'

function setup(
  mode: 'push' | 'pull' = 'pull',
  options: Partial<Parameters<typeof createAmbilight>[0]> = {}
) {
  const container = document.createElement('div')
  document.body.appendChild(container)
  const source = createFakeSource(mode)
  const renderer = createStubRenderer()
  const scheduler = createManualScheduler()
  const clock = createClock()
  const events: AmbilightEvent[] = []
  const ambilight = createAmbilight({
    container,
    source,
    renderer,
    scheduler,
    now: clock.now,
    pauseWhenOffscreen: false,
    ...options,
  })
  ambilight.subscribe((event) => events.push(event))
  return { container, source, renderer, scheduler, clock, ambilight, events }
}

describe('createAmbilight', () => {
  beforeEach(() => {
    document.body.innerHTML = ''
  })
  afterEach(() => {
    vi.restoreAllMocks()
  })

  it('mounts the glow element first in the container and upgrades static positioning', () => {
    const { container, renderer } = setup()
    container.appendChild(document.createElement('video'))
    expect(container.firstChild).toBe(renderer.element)
    expect(container.style.position).toBe('relative')
    expect(container.style.isolation).toBe('isolate')
    expect(renderer.element.style.zIndex).toBe('')
  })

  it('applies resolved options to the renderer at creation', () => {
    const { renderer, ambilight } = setup('pull', { blur: 30, resolution: 64, fps: 15 })
    expect(renderer.styles.at(-1)?.blur).toBe(30)
    expect(renderer.resolutions.at(-1)).toBe(64)
    expect(ambilight.getOptions()).toMatchObject({
      blur: 30,
      resolution: 64,
      fps: 15,
      pauseWhenHidden: true,
    })
  })

  it('renders the current frame on start even when the source is idle', () => {
    const { renderer, ambilight } = setup()
    expect(renderer.rendered).toHaveLength(1)
    expect(ambilight.getState().framesRendered).toBe(1)
    expect(ambilight.getState().sampling).toBe(false)
  })

  it('runs a paced animation loop for active pull sources and stops when idle', () => {
    const { source, renderer, scheduler, ambilight } = setup('pull', { fps: 30 })
    expect(scheduler.pending).toBe(0)
    source.setActive(true)
    expect(scheduler.pending).toBe(1)
    expect(ambilight.getState().sampling).toBe(true)
    for (let i = 1; i <= 12; i += 1) scheduler.tick(i * (1000 / 60))
    // 1 initial render + every second 60 Hz tick.
    expect(renderer.rendered.length).toBe(1 + 6)
    source.setActive(false)
    expect(scheduler.pending).toBe(0)
    expect(ambilight.getState().sampling).toBe(false)
  })

  it('renders pushed frames through the fps cap and counts skipped frames', () => {
    const { source, renderer, clock, ambilight } = setup('push', { fps: 30 })
    source.setActive(true)
    for (let i = 0; i < 4; i += 1) {
      clock.advance(1000 / 60)
      source.emit({ type: 'frame', frame: createFakeFrame(1280, 720, i) })
    }
    expect(renderer.rendered.length).toBe(1 + 2)
    expect(ambilight.getState().framesSkipped).toBe(2)
    expect(ambilight.getState().sampling).toBe(true)
  })

  it('emits samplingchange when sampling starts and stops', () => {
    const { source, ambilight, events } = setup('push')
    const sampling = () =>
      events
        .filter((e) => e.type === 'samplingchange')
        .map((e) => (e.type === 'samplingchange' ? e.sampling : null))
    source.setActive(true)
    expect(sampling()).toEqual([true])
    expect(ambilight.getState().sampling).toBe(true)
    source.setActive(false)
    expect(sampling()).toEqual([true, false])
    source.setActive(true)
    ambilight.stop()
    expect(sampling()).toEqual([true, false, true, false])
  })

  it('renders once on invalidate and resize while running, and clears on clear', () => {
    const { source, renderer } = setup()
    source.emit({ type: 'invalidate' })
    source.emit({ type: 'resize', size: { width: 10, height: 10 } })
    expect(renderer.rendered).toHaveLength(3)
    source.emit({ type: 'clear' })
    expect(renderer.clears).toBe(1)
  })

  it('stop unsubscribes from the source and cancels the loop; start resubscribes', () => {
    const { source, scheduler, ambilight, renderer } = setup()
    source.setActive(true)
    expect(source.listenerCount).toBe(1)
    ambilight.stop()
    expect(source.listenerCount).toBe(0)
    expect(scheduler.pending).toBe(0)
    source.emit({ type: 'invalidate' })
    expect(renderer.rendered).toHaveLength(1)
    ambilight.start()
    expect(source.listenerCount).toBe(1)
    expect(scheduler.pending).toBe(1)
  })

  it('does not render while the document is hidden and resumes when visible', () => {
    const { source, renderer, ambilight, events } = setup('push')
    Object.defineProperty(document, 'visibilityState', { configurable: true, get: () => 'hidden' })
    document.dispatchEvent(new Event('visibilitychange'))
    expect(ambilight.getState().visible).toBe(false)
    source.emit({ type: 'frame', frame: createFakeFrame() })
    expect(renderer.rendered).toHaveLength(1)
    Object.defineProperty(document, 'visibilityState', { configurable: true, get: () => 'visible' })
    document.dispatchEvent(new Event('visibilitychange'))
    expect(renderer.rendered).toHaveLength(2)
    expect(events.filter((e) => e.type === 'visibilitychange')).toHaveLength(2)
  })

  it('swaps sources without leaking listeners and clears when set to null', () => {
    const { source, renderer, ambilight, events } = setup()
    const other = createFakeSource('push', createFakeFrame(640, 360))
    ambilight.setSource(other)
    expect(source.listenerCount).toBe(0)
    expect(other.listenerCount).toBe(1)
    expect(renderer.rendered.at(-1)?.width).toBe(640)
    expect(ambilight.getState().sourceKind).toBe('fake')
    ambilight.setSource(null)
    expect(other.listenerCount).toBe(0)
    expect(renderer.clears).toBe(1)
    expect(events.filter((e) => e.type === 'sourcechange')).toHaveLength(2)
  })

  it('update re-resolves options, re-renders and restarts pacing', () => {
    const { renderer, ambilight, source, scheduler } = setup()
    source.setActive(true)
    ambilight.update({ blur: 10, fps: 0 })
    expect(renderer.styles.at(-1)).toMatchObject({ blur: 10, opacity: 0.5 })
    expect(ambilight.getOptions().fps).toBe(0)
    scheduler.tick(1)
    scheduler.tick(2)
    // initial + update re-render + two uncapped ticks
    expect(renderer.rendered).toHaveLength(4)
  })

  it('records render errors without stopping', () => {
    const { renderer, ambilight, source, events } = setup()
    renderer.failNext = true
    source.emit({ type: 'invalidate' })
    expect(ambilight.getState().renderErrors).toBe(1)
    expect(events.some((e) => e.type === 'error')).toBe(true)
    expect(ambilight.getState().running).toBe(true)
  })

  it('tracks render durations and buffer size', () => {
    const { ambilight, renderer } = setup()
    expect(ambilight.getState().bufferWidth).toBe(160)
    expect(ambilight.getState().bufferHeight).toBe(90)
    expect(renderer.getBufferSize()).toEqual({ width: 160, height: 90 })
    expect(ambilight.getState().averageRenderDurationMs).toBe(0)
  })

  it('dispose stops, unmounts and becomes inert', () => {
    const { ambilight, renderer, source, container, events } = setup()
    source.setActive(true)
    ambilight.dispose()
    expect(renderer.disposed).toBe(true)
    expect(container.contains(renderer.element)).toBe(false)
    expect(source.listenerCount).toBe(0)
    expect(source.disposed).toBe(false)
    expect(events.at(-1)?.type).toBe('dispose')
    ambilight.start()
    expect(ambilight.getState().running).toBe(false)
    expect(ambilight.renderOnce()).toBe(false)
  })

  it('respects autoStart: false', () => {
    const { ambilight, renderer } = setup('pull', { autoStart: false })
    expect(ambilight.getState().running).toBe(false)
    expect(renderer.rendered).toHaveLength(0)
    expect(ambilight.renderOnce()).toBe(true)
  })
})

describe('resolveSamplingOptions', () => {
  it('fills defaults and rejects invalid numbers', () => {
    expect(resolveSamplingOptions()).toEqual(DEFAULT_SAMPLING_OPTIONS)
    expect(resolveSamplingOptions({ fps: -1, resolution: 0 })).toEqual(DEFAULT_SAMPLING_OPTIONS)
    expect(resolveSamplingOptions({ fps: 0, pauseWhenHidden: false })).toMatchObject({
      fps: 0,
      pauseWhenHidden: false,
    })
  })
})
