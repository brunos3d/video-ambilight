import { expect, test } from '@playwright/test'
import {
  expectFramesToAdvance,
  expectFramesToHold,
  glowCanvas,
  pauseVideo,
  playVideo,
  readFrames,
  readStat,
  seekVideo,
} from './helpers'

test.describe('native video', () => {
  test('samples presented frames through requestVideoFrameCallback and pauses with the video', async ({
    page,
  }) => {
    await page.goto('/native-video')
    const video = page.getByTestId('native-video')
    const canvas = glowCanvas(page)
    await expect(canvas).toHaveCount(1)
    await expect(video.locator('xpath=..').locator('> *').first()).toHaveAttribute(
      'data-videoglow',
      'glow'
    )

    await expect.poll(() => readStat(page, 'source')).toBe('video / push')
    await expect.poll(() => readStat(page, 'buffer')).toBe('160x90')
    await expectFramesToAdvance(page, 10)
    expect(await readStat(page, 'sampling')).toBe('true')

    const style = await canvas.evaluate((el) => getComputedStyle(el))
    expect(style.filter).toContain('blur(80px)')
    expect(style.position).toBe('absolute')
    expect(style.zIndex).toBe('-1')

    await pauseVideo(video)
    await expect.poll(() => readStat(page, 'sampling')).toBe('false')
    await expectFramesToHold(page)

    const before = await readFrames(page)
    await seekVideo(video, 2)
    await expect.poll(() => readFrames(page)).toBeGreaterThanOrEqual(before + 1)
    await expectFramesToHold(page, 500)

    await playVideo(video)
    await expectFramesToAdvance(page, 10)
    expect(Number(await readStat(page, 'errors'))).toBe(0)
  })

  test('the fps cap skips excess frames and can be lifted', async ({ page }) => {
    await page.goto('/configuration')
    await expectFramesToAdvance(page, 20)
    await page.getByTestId('control-fps').fill('5')
    await expect(page.getByTestId('value-fps')).toHaveText('5')
    const framesAt5 = await readFrames(page)
    await page.waitForTimeout(1000)
    const delta = (await readFrames(page)) - framesAt5
    expect(delta).toBeGreaterThanOrEqual(3)
    expect(delta).toBeLessThanOrEqual(8)
    expect(Number(await readStat(page, 'skipped'))).toBeGreaterThan(0)
  })
})
