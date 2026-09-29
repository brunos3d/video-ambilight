import { createEmitter } from '@videoglow/core'
import type { Listener, Unsubscribe } from '@videoglow/core'
import { YouTubePlayerState } from '../iframe-api/types'
import type { YouTubePlayerErrorCode } from '../iframe-api/types'
import type {
  YouTubePlayerController,
  YouTubePlayerControllerEvent,
} from '../player/player-controller'

/** How the follower tracks the leader. */
export interface SynchronizationPolicy {
  /** Time difference that triggers a corrective seek. Default 0.25 s. */
  readonly driftToleranceSeconds: number
  /** Drift check period while the leader is playing. Default 1000 ms. */
  readonly checkIntervalMs: number
  /** Added to the target time of corrective seeks to compensate command latency. Default 0. */
  readonly seekLeadSeconds: number
  /** Mirror `setPlaybackRate`. Default true. */
  readonly mirrorPlaybackRate: boolean
  /** Pause the follower while the leader buffers so it cannot run ahead. Default true. */
  readonly pauseWhileLeaderBuffers: boolean
}

export const DEFAULT_SYNCHRONIZATION_POLICY: SynchronizationPolicy = Object.freeze({
  driftToleranceSeconds: 0.25,
  checkIntervalMs: 1000,
  seekLeadSeconds: 0,
  mirrorPlaybackRate: true,
  pauseWhileLeaderBuffers: true,
})

export type FollowerAction = 'play' | 'pause' | 'none'

export type CoordinatorEvent =
  | { readonly type: 'start' }
  | { readonly type: 'stop' }
  | { readonly type: 'ready' }
  | {
      readonly type: 'state-mirrored'
      readonly leaderState: YouTubePlayerState
      readonly action: FollowerAction
    }
  | { readonly type: 'rate-mirrored'; readonly rate: number }
  | {
      readonly type: 'drift-checked'
      readonly drift: number
      readonly leaderTime: number
      readonly followerTime: number
    }
  | { readonly type: 'drift-corrected'; readonly drift: number; readonly target: number }
  | { readonly type: 'follower-autoplay-blocked' }
  | { readonly type: 'follower-error'; readonly code: YouTubePlayerErrorCode }
  | { readonly type: 'leader-error'; readonly code: YouTubePlayerErrorCode }

export interface CoordinatorSnapshot {
  readonly running: boolean
  readonly ready: boolean
  readonly leaderState: YouTubePlayerState
  readonly followerState: YouTubePlayerState
  readonly leaderTime: number
  readonly followerTime: number
  /** Last measured drift in seconds (leader minus follower), null before the first check. */
  readonly drift: number | null
  readonly checks: number
  readonly corrections: number
  readonly lastCorrectionAt: number | null
}

export interface PlaybackCoordinator {
  start(): void
  stop(): void
  /** Align the follower to the leader now, regardless of the tolerance. */
  sync(): void
  getPolicy(): SynchronizationPolicy
  setPolicy(policy: Partial<SynchronizationPolicy>): void
  getSnapshot(): CoordinatorSnapshot
  subscribe(listener: Listener<CoordinatorEvent>): Unsubscribe
  dispose(): void
}

export interface CoordinatorDependencies {
  readonly setInterval?: (callback: () => void, ms: number) => unknown
  readonly clearInterval?: (handle: unknown) => void
  readonly now?: () => number
}

export function resolveSynchronizationPolicy(
  input: Partial<SynchronizationPolicy> = {},
  base: SynchronizationPolicy = DEFAULT_SYNCHRONIZATION_POLICY
): SynchronizationPolicy {
  const positive = (value: number | undefined, fallback: number): number =>
    typeof value === 'number' && Number.isFinite(value) && value >= 0 ? value : fallback
  return {
    driftToleranceSeconds: positive(input.driftToleranceSeconds, base.driftToleranceSeconds),
    checkIntervalMs: Math.max(50, positive(input.checkIntervalMs, base.checkIntervalMs)),
    seekLeadSeconds:
      typeof input.seekLeadSeconds === 'number' && Number.isFinite(input.seekLeadSeconds)
        ? input.seekLeadSeconds
        : base.seekLeadSeconds,
    mirrorPlaybackRate: input.mirrorPlaybackRate ?? base.mirrorPlaybackRate,
    pauseWhileLeaderBuffers: input.pauseWhileLeaderBuffers ?? base.pauseWhileLeaderBuffers,
  }
}

/**
 * Keeps a follower player aligned with a leader player. The leader is the
 * authoritative clock and is never commanded. Mirroring is event driven; drift
 * is checked on a fixed interval while the leader plays and corrected with at
 * most one seek per check.
 */
export function createPlaybackCoordinator(
  leader: YouTubePlayerController,
  follower: YouTubePlayerController,
  policyInput: Partial<SynchronizationPolicy> = {},
  deps: CoordinatorDependencies = {}
): PlaybackCoordinator {
  const emitter = createEmitter<CoordinatorEvent>()
  const schedule = deps.setInterval ?? ((cb, ms) => setInterval(cb, ms))
  const unschedule =
    deps.clearInterval ?? ((handle) => clearInterval(handle as ReturnType<typeof setInterval>))
  const now = deps.now ?? (() => Date.now())

  let policy = resolveSynchronizationPolicy(policyInput)
  let running = false
  let disposed = false
  let bothReady = false
  let interval: unknown = null
  let unsubscribeLeader: Unsubscribe | null = null
  let unsubscribeFollower: Unsubscribe | null = null
  let lastDrift: number | null = null
  let checks = 0
  let corrections = 0
  let lastCorrectionAt: number | null = null

  const readyPromise = Promise.all([leader.ready, follower.ready]).then(() => {
    if (disposed) return
    bothReady = true
    follower.mute()
    emitter.emit({ type: 'ready' })
    if (running) reconcile(leader.getState())
  })

  function canCommand(): boolean {
    return running && bothReady && !disposed && follower.isReady() && leader.isReady()
  }

  function measureDrift(): number {
    return leader.getCurrentTime() - follower.getCurrentTime()
  }

  function correct(drift: number): void {
    const target = Math.max(0, leader.getCurrentTime() + policy.seekLeadSeconds)
    follower.seekTo(target)
    corrections += 1
    lastCorrectionAt = now()
    emitter.emit({ type: 'drift-corrected', drift, target })
  }

  function alignIfNeeded(force = false): void {
    if (!canCommand()) return
    const drift = measureDrift()
    lastDrift = drift
    if (force || Math.abs(drift) > policy.driftToleranceSeconds) {
      correct(drift)
    }
  }

  function startInterval(): void {
    if (interval !== null) return
    interval = schedule(check, policy.checkIntervalMs)
  }

  function stopInterval(): void {
    if (interval === null) return
    unschedule(interval)
    interval = null
  }

  function check(): void {
    if (!canCommand()) return
    if (leader.getState() !== YouTubePlayerState.PLAYING) {
      stopInterval()
      return
    }
    checks += 1
    const leaderTime = leader.getCurrentTime()
    const followerTime = follower.getCurrentTime()
    const drift = leaderTime - followerTime
    lastDrift = drift
    emitter.emit({ type: 'drift-checked', drift, leaderTime, followerTime })

    const followerState = follower.getState()
    if (
      followerState !== YouTubePlayerState.PLAYING &&
      followerState !== YouTubePlayerState.BUFFERING
    ) {
      follower.play()
    }
    if (Math.abs(drift) > policy.driftToleranceSeconds) {
      correct(drift)
    }
  }

  /** Bring the follower into the state implied by the leader's state. */
  function reconcile(state: YouTubePlayerState): void {
    if (!canCommand()) return
    let action: FollowerAction = 'none'
    switch (state) {
      case YouTubePlayerState.PLAYING:
        alignIfNeeded()
        follower.play()
        action = 'play'
        startInterval()
        break
      case YouTubePlayerState.PAUSED:
        follower.pause()
        alignIfNeeded()
        action = 'pause'
        stopInterval()
        break
      case YouTubePlayerState.BUFFERING:
        if (policy.pauseWhileLeaderBuffers) {
          follower.pause()
          action = 'pause'
        }
        stopInterval()
        break
      case YouTubePlayerState.ENDED:
        follower.pause()
        alignIfNeeded()
        action = 'pause'
        stopInterval()
        break
      case YouTubePlayerState.CUED:
      case YouTubePlayerState.UNSTARTED:
        stopInterval()
        break
    }
    emitter.emit({ type: 'state-mirrored', leaderState: state, action })
  }

  function onLeaderEvent(event: YouTubePlayerControllerEvent): void {
    switch (event.type) {
      case 'statechange':
        reconcile(event.state)
        break
      case 'ratechange':
        if (policy.mirrorPlaybackRate && canCommand()) {
          follower.setPlaybackRate(event.rate)
          emitter.emit({ type: 'rate-mirrored', rate: event.rate })
        }
        break
      case 'error':
        emitter.emit({ type: 'leader-error', code: event.code })
        break
      case 'destroy':
        coordinator.stop()
        break
    }
  }

  function onFollowerEvent(event: YouTubePlayerControllerEvent): void {
    switch (event.type) {
      case 'statechange':
        // A follower that starts on its own (autoplay, loop) must not run while the leader is not playing.
        if (
          event.state === YouTubePlayerState.PLAYING &&
          canCommand() &&
          leader.getState() !== YouTubePlayerState.PLAYING
        ) {
          follower.pause()
        }
        break
      case 'autoplayblocked':
        emitter.emit({ type: 'follower-autoplay-blocked' })
        break
      case 'error':
        emitter.emit({ type: 'follower-error', code: event.code })
        break
      case 'destroy':
        coordinator.stop()
        break
    }
  }

  const coordinator: PlaybackCoordinator = {
    start() {
      if (running || disposed) return
      running = true
      unsubscribeLeader = leader.subscribe(onLeaderEvent)
      unsubscribeFollower = follower.subscribe(onFollowerEvent)
      emitter.emit({ type: 'start' })
      if (bothReady) {
        if (policy.mirrorPlaybackRate) follower.setPlaybackRate(leader.getPlaybackRate())
        reconcile(leader.getState())
      }
    },
    stop() {
      if (!running) return
      running = false
      stopInterval()
      unsubscribeLeader?.()
      unsubscribeFollower?.()
      unsubscribeLeader = null
      unsubscribeFollower = null
      emitter.emit({ type: 'stop' })
    },
    sync() {
      alignIfNeeded(true)
    },
    getPolicy: () => policy,
    setPolicy(next) {
      policy = resolveSynchronizationPolicy(next, policy)
      if (interval !== null) {
        stopInterval()
        startInterval()
      }
    },
    getSnapshot() {
      return {
        running,
        ready: bothReady,
        leaderState: leader.getState(),
        followerState: follower.getState(),
        leaderTime: leader.getCurrentTime(),
        followerTime: follower.getCurrentTime(),
        drift: lastDrift,
        checks,
        corrections,
        lastCorrectionAt,
      }
    },
    subscribe: (listener) => emitter.subscribe(listener),
    dispose() {
      if (disposed) return
      coordinator.stop()
      disposed = true
      emitter.clear()
    },
  }

  void readyPromise
  return coordinator
}
