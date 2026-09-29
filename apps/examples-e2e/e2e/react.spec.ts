import { expect, test } from '@playwright/test'
import { expectFramesToAdvance, expectFramesToHold, glowCanvas, readStat } from './helpers'

test('hooks mount the glow into user markup and can be disabled', async ({ page }) => {
  await page.goto('/react')
  const figure = page.getByTestId('hooks-figure')
  await expect(glowCanvas(figure)).toHaveCount(1)
  await expect(figure.locator('> *').first()).toHaveAttribute('data-videoglow', 'glow')
  await expect(figure).toHaveCSS('position', 'relative')
  await expect(figure).toHaveCSS('isolation', 'isolate')
  await expectFramesToAdvance(page, 5)

  await page.getByTestId('toggle-enabled').click()
  await expect.poll(() => readStat(page, 'running')).toBe('false')
  await expectFramesToHold(page)
  await expect(glowCanvas(figure)).toHaveCount(1)

  await page.getByTestId('toggle-enabled').click()
  await expect.poll(() => readStat(page, 'running')).toBe('true')
  await expectFramesToAdvance(page, 5)
})

test('client-side navigation disposes engines without leaking canvases', async ({ page }) => {
  await page.goto('/react')
  await expect(glowCanvas(page)).toHaveCount(1)
  await page.getByRole('link', { name: 'Native video' }).click()
  await expect(page).toHaveURL(/native-video/)
  await expect(glowCanvas(page)).toHaveCount(1)
  await page.getByRole('link', { name: 'Overview' }).click()
  await expect(page).toHaveURL(/\/$/)
  await expect(glowCanvas(page)).toHaveCount(0)
})
