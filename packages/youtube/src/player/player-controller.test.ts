import { describe, expect, it, vi } from 'vitest'
import { createYouTubePlayer } from './player-controller'
import type { YouTubePlayerControllerEvent } from './player-controller'
import { YouTubePlayerState } from '../iframe-api/types'
import { createFakeIframeApi, flushPromises } from '../test-utils/fake-iframe-api'

async function setup(playerVars = {}) {
  const fake = createFakeIframeApi()
  const host = document.createElement('div')
  document.body.appendChild(host)
  const events: YouTubePlayerControllerEvent[] = []
  const controller = createYouTubePlayer(host, {
    videoId: 'abc',
    playerVars,
    loadApi: () => Promise.resolve(fake.api),
  })
  controller.subscribe((e) => events.push(e))
  await flushPromises()
  const player = fake.players[0]
  if (!player) throw new Error('player not created')
  return { fake, host, controller, player, events }
}

describe('createYouTubePlayer', () => {
  it('creates the player inside the host with enablejsapi, origin and the given video', async () => {
    const { host, player } = await setup({ controls: 0 })
    expect(host.contains(player.getIframe())).toBe(true)
    expect(player.options.videoId).toBe('abc')
    expect(player.options.playerVars).toMatchObject({
      enablejsapi: 1,
      controls: 0,
      playsinline: 1,
      origin: window.location.origin,
    })
    expect(player.options.width).toBe('100%')
  })

  it('ignores commands before ready and forwards them after', async () => {
    const { controller, player, events } = await setup()
    controller.play()
    controller.seekTo(10)
    expect(player.calls).toHaveLength(0)
    expect(controller.isReady()).toBe(false)
    expect(controller.getState()).toBe(YouTubePlayerState.UNSTARTED)
    player.emitReady()
    await controller.ready
    expect(controller.isReady()).toBe(true)
    expect(events.map((e) => e.type)).toEqual(['ready'])
    controller.play()
    controller.seekTo(-3)
    controller.setPlaybackRate(1.5)
    controller.mute()
    controller.setVolume(150)
    expect(player.callsTo('playVideo')).toHaveLength(1)
    expect(player.callsTo('seekTo')).toEqual([[0, true]])
    expect(player.callsTo('setPlaybackRate')).toEqual([[1.5]])
    expect(player.muted).toBe(true)
    expect(player.callsTo('setVolume')).toEqual([[100]])
  })

  it('reflects state, time, rate and typed events', async () => {
    const { controller, player, events } = await setup()
    player.emitReady()
    await controller.ready
    player.time = 42.5
    player.emitState(YouTubePlayerState.PLAYING)
    player.emitRate(2)
    player.emitError(150)
    player.emitAutoplayBlocked()
    expect(controller.getState()).toBe(YouTubePlayerState.PLAYING)
    expect(controller.getCurrentTime()).toBe(42.5)
    expect(controller.getPlaybackRate()).toBe(2)
    expect(controller.getDuration()).toBe(600)
    expect(events.slice(1)).toEqual([
      { type: 'statechange', state: YouTubePlayerState.PLAYING },
      { type: 'ratechange', rate: 2 },
      { type: 'error', code: 150 },
      { type: 'autoplayblocked' },
    ])
  })

  it('tracks the video id through loadVideo and cueVideo', async () => {
    const { controller, player } = await setup()
    player.emitReady()
    await controller.ready
    controller.loadVideo('next', 5)
    expect(controller.getVideoId()).toBe('next')
    expect(player.callsTo('loadVideoById')).toEqual([['next', 5]])
    controller.cueVideo('cued')
    expect(player.callsTo('cueVideoById')).toEqual([['cued', undefined]])
  })

  it('destroys the player, removes the iframe and becomes inert', async () => {
    const { controller, player, host, events } = await setup()
    player.emitReady()
    await controller.ready
    controller.destroy()
    expect(player.destroyed).toBe(true)
    expect(host.querySelector('iframe')).toBeNull()
    expect(controller.isDestroyed()).toBe(true)
    expect(controller.isReady()).toBe(false)
    expect(controller.getRawPlayer()).toBeNull()
    expect(events.at(-1)?.type).toBe('destroy')
    controller.play()
    expect(player.callsTo('playVideo')).toHaveLength(0)
  })

  it('does not create a player when destroyed before the API resolves', async () => {
    const fake = createFakeIframeApi()
    const host = document.createElement('div')
    let resolveApi: (api: typeof fake.api) => void = () => {}
    const controller = createYouTubePlayer(host, {
      videoId: 'abc',
      loadApi: () => new Promise((resolve) => (resolveApi = resolve)),
    })
    controller.destroy()
    resolveApi(fake.api)
    await flushPromises()
    expect(fake.players).toHaveLength(0)
    expect(host.childNodes).toHaveLength(0)
  })

  it('emits loaderror when the API fails to load', async () => {
    const host = document.createElement('div')
    const onEvent = vi.fn()
    const controller = createYouTubePlayer(host, {
      videoId: 'abc',
      loadApi: () => Promise.reject(new Error('offline')),
    })
    controller.subscribe(onEvent)
    await flushPromises()
    expect(onEvent).toHaveBeenCalledWith({ type: 'loaderror', error: expect.any(Error) })
  })
})
