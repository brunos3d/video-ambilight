import { beforeEach, afterEach, describe, expect, it, vi } from 'vitest'
import {
  createPlaybackCoordinator,
  DEFAULT_SYNCHRONIZATION_POLICY,
  resolveSynchronizationPolicy,
} from './playback-coordinator'
import type { CoordinatorEvent } from './playback-coordinator'
import { createYouTubePlayer } from '../player/player-controller'
import { YouTubePlayerState } from '../iframe-api/types'
import { createFakeIframeApi, flushPromises } from '../test-utils/fake-iframe-api'

const { PLAYING, PAUSED, BUFFERING, ENDED } = YouTubePlayerState

async function setup(policy = {}) {
  const fake = createFakeIframeApi()
  const loadApi = () => Promise.resolve(fake.api)
  const leader = createYouTubePlayer(document.createElement('div'), { videoId: 'v', loadApi })
  const follower = createYouTubePlayer(document.createElement('div'), { videoId: 'v', loadApi })
  await flushPromises()
  const [leaderPlayer, followerPlayer] = fake.players
  if (!leaderPlayer || !followerPlayer) throw new Error('players missing')
  const events: CoordinatorEvent[] = []
  const coordinator = createPlaybackCoordinator(leader, follower, policy)
  coordinator.subscribe((e) => events.push(e))
  const ready = async () => {
    leaderPlayer.emitReady()
    followerPlayer.emitReady()
    await flushPromises()
  }
  return {
    leader,
    follower,
    leaderPlayer,
    followerPlayer,
    coordinator,
    events,
    ready,
    types: () => events.map((e) => e.type),
  }
}

describe('createPlaybackCoordinator', () => {
  beforeEach(() => {
    vi.useFakeTimers()
  })
  afterEach(() => {
    vi.useRealTimers()
  })

  it('mutes the follower and reconciles once both players are ready', async () => {
    const { coordinator, followerPlayer, leaderPlayer, ready, types } = await setup()
    coordinator.start()
    expect(coordinator.getSnapshot().ready).toBe(false)
    leaderPlayer.state = PAUSED
    await ready()
    expect(followerPlayer.muted).toBe(true)
    expect(types()).toEqual(['start', 'ready', 'state-mirrored'])
    expect(followerPlayer.callsTo('pauseVideo')).toHaveLength(1)
  })

  it('mirrors play, pause, buffering and ended without commanding the leader', async () => {
    const { coordinator, leaderPlayer, followerPlayer, ready, events } = await setup()
    coordinator.start()
    await ready()
    leaderPlayer.time = 10
    followerPlayer.time = 10
    leaderPlayer.emitState(PLAYING)
    expect(followerPlayer.callsTo('playVideo')).toHaveLength(1)
    leaderPlayer.emitState(BUFFERING)
    expect(followerPlayer.callsTo('pauseVideo')).toHaveLength(1)
    leaderPlayer.emitState(PLAYING)
    leaderPlayer.emitState(PAUSED)
    leaderPlayer.emitState(ENDED)
    expect(followerPlayer.callsTo('pauseVideo')).toHaveLength(3)
    expect(leaderPlayer.calls.filter((c) => c.method !== 'mute')).toHaveLength(0)
    const mirrored = events.filter((e) => e.type === 'state-mirrored')
    expect(mirrored.map((e) => (e.type === 'state-mirrored' ? e.action : null))).toEqual([
      'none',
      'play',
      'pause',
      'play',
      'pause',
      'pause',
    ])
  })

  it('aligns the follower only when drift exceeds the tolerance', async () => {
    const { coordinator, leaderPlayer, followerPlayer, ready } = await setup({
      driftToleranceSeconds: 0.25,
    })
    coordinator.start()
    await ready()
    leaderPlayer.time = 20
    followerPlayer.time = 19.9
    leaderPlayer.emitState(PLAYING)
    expect(followerPlayer.callsTo('seekTo')).toHaveLength(0)
    leaderPlayer.time = 30
    leaderPlayer.emitState(PAUSED)
    expect(followerPlayer.callsTo('seekTo')).toEqual([[30, true]])
    expect(coordinator.getSnapshot().corrections).toBe(1)
  })

  it('checks drift on an interval while playing and corrects at most once per check', async () => {
    const { coordinator, leaderPlayer, followerPlayer, ready, events } = await setup({
      checkIntervalMs: 500,
      seekLeadSeconds: 0.1,
    })
    coordinator.start()
    await ready()
    leaderPlayer.time = 0
    followerPlayer.time = 0
    leaderPlayer.emitState(PLAYING)
    followerPlayer.state = PLAYING
    leaderPlayer.time = 1
    followerPlayer.time = 1.1
    vi.advanceTimersByTime(500)
    expect(events.filter((e) => e.type === 'drift-checked')).toHaveLength(1)
    expect(followerPlayer.callsTo('seekTo')).toHaveLength(0)
    leaderPlayer.time = 5
    followerPlayer.time = 3
    vi.advanceTimersByTime(500)
    expect(followerPlayer.callsTo('seekTo')).toEqual([[5.1, true]])
    const snapshot = coordinator.getSnapshot()
    expect(snapshot.checks).toBe(2)
    expect(snapshot.corrections).toBe(1)
    expect(snapshot.drift).toBe(2)
    leaderPlayer.emitState(PAUSED)
    vi.advanceTimersByTime(2000)
    expect(snapshot.checks).toBe(2)
  })

  it('restarts a stalled follower during checks and pauses a follower that plays on its own', async () => {
    const { coordinator, leaderPlayer, followerPlayer, ready } = await setup({
      checkIntervalMs: 200,
    })
    coordinator.start()
    await ready()
    leaderPlayer.emitState(PLAYING)
    followerPlayer.state = PAUSED
    vi.advanceTimersByTime(200)
    expect(followerPlayer.callsTo('playVideo')).toHaveLength(2)
    leaderPlayer.emitState(PAUSED)
    followerPlayer.emitState(PLAYING)
    expect(followerPlayer.callsTo('pauseVideo')).toHaveLength(2)
  })

  it('mirrors playback rate and surfaces follower problems', async () => {
    const { coordinator, leaderPlayer, followerPlayer, ready, events } = await setup()
    coordinator.start()
    await ready()
    leaderPlayer.emitRate(1.5)
    expect(followerPlayer.rate).toBe(1.5)
    followerPlayer.emitAutoplayBlocked()
    followerPlayer.emitError(101)
    leaderPlayer.emitError(153)
    expect(events.slice(-4)).toEqual([
      { type: 'rate-mirrored', rate: 1.5 },
      { type: 'follower-autoplay-blocked' },
      { type: 'follower-error', code: 101 },
      { type: 'leader-error', code: 153 },
    ])
  })

  it('sync() forces an alignment and setPolicy reschedules the interval', async () => {
    const { coordinator, leaderPlayer, followerPlayer, ready, events } = await setup({
      checkIntervalMs: 1000,
    })
    coordinator.start()
    await ready()
    leaderPlayer.time = 3
    followerPlayer.time = 3
    coordinator.sync()
    expect(followerPlayer.callsTo('seekTo')).toEqual([[3, true]])
    leaderPlayer.emitState(PLAYING)
    coordinator.setPolicy({ checkIntervalMs: 100 })
    vi.advanceTimersByTime(100)
    expect(events.filter((e) => e.type === 'drift-checked')).toHaveLength(1)
    expect(coordinator.getPolicy()).toMatchObject({
      checkIntervalMs: 100,
      driftToleranceSeconds: 0.25,
    })
  })

  it('stop and dispose release listeners and timers; destroying a player stops it', async () => {
    const { coordinator, leaderPlayer, followerPlayer, leader, ready, types } = await setup({
      checkIntervalMs: 100,
    })
    coordinator.start()
    await ready()
    leaderPlayer.emitState(PLAYING)
    coordinator.stop()
    vi.advanceTimersByTime(1000)
    leaderPlayer.emitState(PAUSED)
    expect(followerPlayer.callsTo('pauseVideo')).toHaveLength(0)
    expect(coordinator.getSnapshot().checks).toBe(0)
    coordinator.start()
    leader.destroy()
    expect(coordinator.getSnapshot().running).toBe(false)
    coordinator.dispose()
    expect(types().filter((t) => t === 'stop')).toHaveLength(2)
  })
})

describe('resolveSynchronizationPolicy', () => {
  it('applies defaults and clamps invalid values', () => {
    expect(resolveSynchronizationPolicy()).toEqual(DEFAULT_SYNCHRONIZATION_POLICY)
    expect(
      resolveSynchronizationPolicy({ checkIntervalMs: 1, driftToleranceSeconds: -1 })
    ).toMatchObject({
      checkIntervalMs: 50,
      driftToleranceSeconds: 0.25,
    })
  })
})
