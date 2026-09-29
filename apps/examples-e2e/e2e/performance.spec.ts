import { expect, test } from '@playwright/test'
import { expectFramesToAdvance, readStat } from './helpers'

test('benchmark renders frames at every resolution and reports per-frame cost', async ({
  page,
}) => {
  await page.goto('/performance')
  await expectFramesToAdvance(page, 5)
  const button = page.getByTestId('run-benchmark')
  await expect(button).toBeEnabled()
  await button.click()
  const table = page.getByTestId('benchmark-table')
  await expect(table).toBeVisible({ timeout: 30_000 })
  const rows = table.locator('tbody tr')
  await expect(rows).toHaveCount(6)
  const results: Record<string, number> = {}
  for (const resolution of [32, 64, 160, 320, 640, 1280]) {
    const value = Number(await page.getByTestId(`perf-${resolution}`).textContent())
    expect(Number.isFinite(value)).toBe(true)
    expect(value).toBeGreaterThanOrEqual(0)
    results[resolution] = value
  }
  test.info().annotations.push({ type: 'benchmark ms/frame', description: JSON.stringify(results) })
  const average = Number((await readStat(page, 'avg-ms')).replace(' ms', ''))
  expect(average).toBeLessThan(16)
})
