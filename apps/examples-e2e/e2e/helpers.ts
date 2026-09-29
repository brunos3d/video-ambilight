import { expect, type Locator, type Page } from '@playwright/test'

export const glowCanvas = (scope: Locator | Page) => scope.locator('canvas[data-videoglow="glow"]')

export async function readStat(page: Page, name: string): Promise<string> {
  return (await page.getByTestId(`stat-${name}`).textContent()) ?? ''
}

export async function readFrames(page: Page): Promise<number> {
  return Number(await readStat(page, 'frames'))
}

/** Waits until the frame counter has advanced by at least `delta`. */
export async function expectFramesToAdvance(page: Page, delta = 5): Promise<void> {
  const start = await readFrames(page)
  await expect
    .poll(() => readFrames(page), { timeout: 10_000 })
    .toBeGreaterThanOrEqual(start + delta)
}

/** Asserts the frame counter stays put over `ms` milliseconds. */
export async function expectFramesToHold(page: Page, ms = 700): Promise<void> {
  const start = await readFrames(page)
  await page.waitForTimeout(ms)
  expect(await readFrames(page)).toBe(start)
}

export async function pauseVideo(video: Locator): Promise<void> {
  await video.evaluate((el) => (el as HTMLVideoElement).pause())
}

export async function playVideo(video: Locator): Promise<void> {
  await video.evaluate((el) => (el as HTMLVideoElement).play())
}

export async function seekVideo(video: Locator, seconds: number): Promise<void> {
  await video.evaluate((el, t) => {
    const v = el as HTMLVideoElement
    return new Promise<void>((resolve) => {
      v.addEventListener('seeked', () => resolve(), { once: true })
      v.currentTime = t
    })
  }, seconds)
}
