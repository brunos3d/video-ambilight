import { useCallback, useSyncExternalStore } from 'react'
import type { Ambilight, AmbilightState } from '@videoglow/core'

const IDLE_STATE: AmbilightState = Object.freeze({
  running: false,
  sampling: false,
  visible: false,
  framesRendered: 0,
  framesSkipped: 0,
  renderErrors: 0,
  lastRenderDurationMs: 0,
  averageRenderDurationMs: 0,
  bufferWidth: 0,
  bufferHeight: 0,
  sourceKind: null,
  sourceMode: null,
})

/**
 * Live engine statistics. Re-renders on every engine event, so use it for
 * diagnostics panels rather than in hot paths.
 */
export function useAmbilightState(ambilight: Ambilight | null): AmbilightState {
  const subscribe = useCallback(
    (onStoreChange: () => void) => {
      if (!ambilight) return () => {}
      return ambilight.subscribe(() => onStoreChange())
    },
    [ambilight]
  )
  const getSnapshot = useCallback(
    () => (ambilight ? snapshotOf(ambilight) : IDLE_STATE),
    [ambilight]
  )
  return useSyncExternalStore(subscribe, getSnapshot, () => IDLE_STATE)
}

const cache = new WeakMap<Ambilight, { key: string; state: AmbilightState }>()

/** Returns a referentially stable snapshot while the state is unchanged. */
function snapshotOf(ambilight: Ambilight): AmbilightState {
  const state = ambilight.getState()
  const key = JSON.stringify(state)
  const cached = cache.get(ambilight)
  if (cached && cached.key === key) return cached.state
  cache.set(ambilight, { key, state })
  return state
}
