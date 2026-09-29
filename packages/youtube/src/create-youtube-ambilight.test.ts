import { describe, expect, it } from 'vitest'
import { createYouTubeAmbilight } from './create-youtube-ambilight'
import { YouTubePlayerState } from './iframe-api/types'
import { createFakeIframeApi, flushPromises } from './test-utils/fake-iframe-api'

describe('createYouTubeAmbilight', () => {
  it('builds glow and player hosts, applies the glow style and creates two players', async () => {
    const fake = createFakeIframeApi()
    const container = document.createElement('div')
    document.body.appendChild(container)
    const ambilight = createYouTubeAmbilight(container, {
      videoId: 'abc',
      glow: { blur: 40 },
      classNames: { glow: 'g', player: 'p' },
      loadApi: () => Promise.resolve(fake.api),
    })
    expect(container.style.position).toBe('relative')
    expect(container.firstElementChild).toBe(ambilight.glowElement)
    expect(container.lastElementChild).toBe(ambilight.playerElement)
    expect(ambilight.glowElement.style.filter).toBe('blur(40px) opacity(0.5) saturate(3)')
    expect(ambilight.glowElement.className).toBe('g')
    expect(ambilight.playerElement.style.aspectRatio).toBe('16 / 9')
    await flushPromises()
    expect(fake.players).toHaveLength(2)
    const [leader, follower] = fake.players
    expect(leader?.options.playerVars).not.toHaveProperty('mute')
    expect(follower?.options.playerVars).toMatchObject({ mute: 1, controls: 0, disablekb: 1 })
    leader?.emitReady()
    follower?.emitReady()
    await ambilight.ready
    expect(follower?.getIframe().getAttribute('aria-hidden')).toBe('true')
    expect(leader?.getIframe().style.width).toBe('100%')
    expect(ambilight.coordinator.getSnapshot().running).toBe(true)
  })

  it('updates the glow, loads videos into both players and disposes everything', async () => {
    const fake = createFakeIframeApi()
    const container = document.createElement('div')
    const ambilight = createYouTubeAmbilight(container, {
      videoId: 'abc',
      loadApi: () => Promise.resolve(fake.api),
    })
    await flushPromises()
    fake.players.forEach((p) => p.emitReady())
    await ambilight.ready
    ambilight.update({ opacity: 0.8 })
    expect(ambilight.getGlowStyle().opacity).toBe(0.8)
    expect(ambilight.glowElement.style.filter).toContain('opacity(0.8)')
    ambilight.loadVideo('next', 2)
    expect(fake.players[0]?.callsTo('loadVideoById')).toEqual([['next', 2]])
    expect(fake.players[1]?.callsTo('cueVideoById')).toEqual([['next', 2]])
    fake.players[0]?.emitState(YouTubePlayerState.PLAYING)
    expect(fake.players[1]?.callsTo('playVideo')).toHaveLength(1)
    ambilight.dispose()
    expect(container.childNodes).toHaveLength(0)
    expect(fake.players.every((p) => p.destroyed)).toBe(true)
    expect(ambilight.coordinator.getSnapshot().running).toBe(false)
  })
})
