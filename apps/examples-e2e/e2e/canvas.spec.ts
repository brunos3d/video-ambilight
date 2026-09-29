import { expect, test } from '@playwright/test'
import {
  expectFramesToAdvance,
  expectFramesToHold,
  glowCanvas,
  readFrames,
  readStat,
} from './helpers'

test('canvas source samples continuously and renders once on demand', async ({ page }) => {
  await page.goto('/canvas')
  await expect(glowCanvas(page)).toHaveCount(1)
  await expect.poll(() => readStat(page, 'source')).toBe('canvas / pull')
  await expect.poll(() => readStat(page, 'buffer')).toBe('160x90')
  await expectFramesToAdvance(page, 10)

  await page.getByTestId('toggle-animation').click()
  await expect.poll(() => readStat(page, 'sampling')).toBe('false')
  await expectFramesToHold(page)

  const before = await readFrames(page)
  await page.getByTestId('render-once').click()
  await expect.poll(() => readFrames(page)).toBe(before + 1)

  await page.getByTestId('toggle-animation').click()
  await expectFramesToAdvance(page, 5)
})
