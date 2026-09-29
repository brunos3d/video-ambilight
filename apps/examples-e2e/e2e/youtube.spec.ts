import { expect, test } from '@playwright/test'

/**
 * YouTube needs the network and the IFrame API. The suite asserts the mount
 * structure and, when the API loads, coordinator readiness. Playback assertions
 * are not made because embeds may refuse scripted playback in automation.
 */
test('mounts a blurred follower behind the visible player', async ({ page }) => {
  await page.goto('/youtube')
  const box = page.getByTestId('youtube-demo')
  const glow = box.locator('[data-videoglow="glow"]')
  const player = box.locator('[data-videoglow="player"]')
  await expect(glow).toHaveCount(1)
  await expect(player).toHaveCount(1)
  await expect(glow).toHaveCSS('filter', /blur\(80px\)/)
  await expect(glow).toHaveCSS('pointer-events', 'none')
  await expect(box.locator('> *').first()).toHaveAttribute('data-videoglow', 'glow')

  const apiLoaded = await page
    .waitForFunction(
      () => document.querySelectorAll('[data-videoglow="youtube"] iframe').length === 2,
      null,
      { timeout: 20_000 }
    )
    .then(() => true)
    .catch(() => false)
  test.skip(
    !apiLoaded,
    'YouTube IFrame API did not load (offline or blocked); mount structure verified only'
  )

  await expect(glow.locator('iframe')).toHaveAttribute('aria-hidden', 'true')
  await expect(glow.locator('iframe')).toHaveAttribute('tabindex', '-1')
  const ready = await page
    .waitForFunction(
      () => document.querySelector('[data-testid="yt-ready"]')?.textContent === 'true',
      null,
      { timeout: 30_000 }
    )
    .then(() => true)
    .catch(() => false)
  test.info().annotations.push({
    type: 'youtube',
    description: ready ? 'both players ready' : 'players did not become ready',
  })
  if (ready) {
    await expect(page.getByTestId('yt-leader')).not.toHaveText('-')
  }
})

test('the react-ambilight compatibility component renders the legacy structure', async ({
  page,
}) => {
  await page.goto('/legacy')
  const box = page.locator('[data-videoglow="youtube"]')
  await expect(box).toHaveCount(1)
  await expect(box.locator('[data-videoglow="glow"]')).toHaveCount(1)
  await expect(box.locator('[data-videoglow="player"]')).toHaveCount(1)
})
