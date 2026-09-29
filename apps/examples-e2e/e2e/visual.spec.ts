import { expect, test } from '@playwright/test'
import { expectFramesToAdvance } from './helpers'

/** Captures reference screenshots of the key pages and attaches them to the report. */
test('captures page screenshots for visual review', async ({ page }, testInfo) => {
  await page.setViewportSize({ width: 1280, height: 900 })
  await page.goto('/native-video')
  await expectFramesToAdvance(page, 5)
  await page.waitForTimeout(500)
  await testInfo.attach('native-video', { body: await page.screenshot(), contentType: 'image/png' })
  await page.screenshot({ path: testInfo.outputPath('native-video.png') })

  await page.goto('/youtube')
  const loaded = await page
    .waitForFunction(
      () => document.querySelector('[data-testid="yt-ready"]')?.textContent === 'true',
      null,
      { timeout: 30_000 }
    )
    .then(() => true)
    .catch(() => false)
  await page.waitForTimeout(1500)
  await page.screenshot({ path: testInfo.outputPath('youtube.png') })
  await testInfo.attach('youtube', { body: await page.screenshot(), contentType: 'image/png' })
  expect(page.url()).toContain('/youtube')
  testInfo.annotations.push({ type: 'youtube-ready', description: String(loaded) })
})
