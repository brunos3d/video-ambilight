import { describe, expect, it } from 'vitest'
import { createFrameClock } from './frame-clock'

describe('createFrameClock', () => {
  it('accepts every second tick of a 60 Hz loop when capped at 30 fps', () => {
    const clock = createFrameClock(30)
    const accepted: number[] = []
    for (let i = 0; i < 12; i += 1) {
      const t = i * (1000 / 60)
      if (clock.shouldRender(t)) accepted.push(i)
    }
    expect(accepted).toEqual([0, 2, 4, 6, 8, 10])
  })

  it('accepts every frame of a jittery 30 fps stream when capped at 30 fps', () => {
    const clock = createFrameClock(30)
    let t = 0
    const jitter = [33.3, 31.9, 34.8, 33.1, 30.2, 35.9]
    const results = jitter.map((delta) => {
      t += delta
      return clock.shouldRender(t)
    })
    expect(results.every(Boolean)).toBe(true)
  })

  it('never throttles when fps is 0', () => {
    const clock = createFrameClock(0)
    expect(clock.shouldRender(0)).toBe(true)
    expect(clock.shouldRender(0.1)).toBe(true)
  })

  it('treats invalid fps as uncapped and can be changed later', () => {
    const clock = createFrameClock(Number.NaN)
    expect(clock.getFps()).toBe(0)
    clock.setFps(10)
    expect(clock.shouldRender(0)).toBe(true)
    expect(clock.shouldRender(50)).toBe(false)
    expect(clock.shouldRender(100)).toBe(true)
  })

  it('reset makes the next frame render immediately', () => {
    const clock = createFrameClock(30)
    expect(clock.shouldRender(0)).toBe(true)
    expect(clock.shouldRender(1)).toBe(false)
    clock.reset()
    expect(clock.shouldRender(2)).toBe(true)
  })
})
