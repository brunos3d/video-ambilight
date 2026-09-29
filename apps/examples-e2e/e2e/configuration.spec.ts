import { expect, test } from '@playwright/test'
import { expectFramesToAdvance, glowCanvas, readStat } from './helpers'

test('live configuration updates style and buffer without recreating the engine', async ({
  page,
}) => {
  await page.goto('/configuration')
  await expectFramesToAdvance(page, 5)
  const canvas = glowCanvas(page)

  await page.getByTestId('control-blur').fill('40')
  await expect(canvas).toHaveCSS('filter', /blur\(40px\)/)
  await page.getByTestId('control-opacity').fill('0.8')
  await expect(canvas).toHaveCSS('filter', /opacity\(0\.8\)/)
  await page.getByTestId('control-scale').fill('1.4')
  await expect(canvas).toHaveCSS('transform', /matrix/)

  await page.getByTestId('control-resolution').fill('64')
  await expect.poll(() => readStat(page, 'buffer')).toBe('64x36')
  expect(await canvas.evaluate((el) => (el as HTMLCanvasElement).width)).toBe(64)

  await page.getByTestId('control-resolution').fill('640')
  await expect.poll(() => readStat(page, 'buffer')).toBe('640x360')
  expect(await canvas.count()).toBe(1)
  expect(Number(await readStat(page, 'errors'))).toBe(0)
})
