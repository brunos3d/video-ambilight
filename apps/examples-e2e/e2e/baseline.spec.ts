import { mkdirSync, writeFileSync } from 'node:fs'
import { dirname } from 'node:path'
import { expect, test } from '@playwright/test'
import { glowCanvas, pauseVideo, seekVideo } from './helpers'

/**
 * Visual regression against the original pipeline: both columns show the same
 * frame under the same CSS. The original column's screenshot becomes the
 * reference for the new column within the same run, so the comparison never
 * depends on stored snapshots or on the machine's fonts.
 */
test('the small-buffer pipeline matches the full-resolution baseline', async ({
  page,
}, testInfo) => {
  // Tall enough for both players and their glow spill; screenshot clips are viewport bound.
  await page.setViewportSize({ width: 1200, height: 2600 })
  await page.goto('/baseline')
  const original = page.getByTestId('baseline-original')
  // Video attributes are forwarded to the <video>; its parent is the glow wrapper.
  const modern = page.getByTestId('baseline-new').locator('xpath=..')
  await expect(glowCanvas(modern)).toHaveCount(1)
  const videos = [original.locator('video'), modern.locator('video')]
  for (const video of videos) {
    await expect
      .poll(() => video.evaluate((el) => (el as HTMLVideoElement).readyState))
      .toBeGreaterThanOrEqual(2)
    await pauseVideo(video)
    await seekVideo(video, 3)
  }
  // Give both pipelines a moment to repaint the seeked frame.
  await page.waitForTimeout(400)
  await original.locator('video').evaluate((el) => ((el as HTMLVideoElement).controls = false))
  await modern.locator('video').evaluate((el) => ((el as HTMLVideoElement).controls = false))
  await page.waitForTimeout(200)

  const shoot = async (locator: typeof original) => {
    const box = await locator.boundingBox()
    if (!box) throw new Error('element has no box')
    const pad = 70
    return page.screenshot({
      clip: {
        x: box.x - pad,
        y: box.y - pad,
        width: box.width + pad * 2,
        height: box.height + pad * 2,
      },
      animations: 'disabled',
    })
  }
  const reference = await shoot(original)
  const candidate = await shoot(modern)
  const referencePath = testInfo.snapshotPath('baseline-reference.png')
  mkdirSync(dirname(referencePath), { recursive: true })
  writeFileSync(referencePath, reference)
  await testInfo.attach('original-pipeline', { body: reference, contentType: 'image/png' })
  await testInfo.attach('videoglow-pipeline', { body: candidate, contentType: 'image/png' })
  expect(candidate).toMatchSnapshot('baseline-reference.png', {
    maxDiffPixelRatio: 0.03,
    threshold: 0.3,
  })
})
