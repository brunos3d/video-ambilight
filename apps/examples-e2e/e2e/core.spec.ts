import { expect, test } from '@playwright/test'
import { expectFramesToAdvance, glowCanvas, readStat } from './helpers'

test('the engine works from plain DOM code', async ({ page }) => {
  await page.goto('/core')
  const host = page.getByTestId('core-host')
  await expect(host.locator('video')).toHaveCount(1)
  await expect(glowCanvas(host)).toHaveCount(1)
  await expect(host.locator('> *').first()).toHaveAttribute('data-videoglow', 'glow')
  await expect.poll(() => readStat(page, 'source')).toBe('video / push')
  await expectFramesToAdvance(page, 10)
  const canvas = glowCanvas(host)
  expect(await canvas.evaluate((el) => (el as HTMLCanvasElement).width)).toBe(160)
  expect(await canvas.evaluate((el) => (el as HTMLCanvasElement).height)).toBe(90)
  // The buffer really contains the frame: sample pixels from the same-origin canvas.
  const nonBlack = await canvas.evaluate((el) => {
    const c = el as HTMLCanvasElement
    const data = c.getContext('2d')?.getImageData(0, 0, c.width, c.height).data
    if (!data) return 0
    let count = 0
    for (let i = 0; i < data.length; i += 4)
      if (data[i]! + data[i + 1]! + data[i + 2]! > 60) count += 1
    return count
  })
  expect(nonBlack).toBeGreaterThan(160 * 90 * 0.2)
})
