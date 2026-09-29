import { useEffect, useState, useSyncExternalStore, type DependencyList } from 'react'

interface ResourceStore<T> {
  get(): T | null
  set(value: T | null): void
  subscribe(listener: () => void): () => void
}

function createResourceStore<T>(): ResourceStore<T> {
  let value: T | null = null
  const listeners = new Set<() => void>()
  return {
    get: () => value,
    set(next) {
      if (next === value) return
      value = next
      for (const listener of Array.from(listeners)) listener()
    },
    subscribe(listener) {
      listeners.add(listener)
      return () => {
        listeners.delete(listener)
      }
    },
  }
}

const getServerSnapshot = (): null => null

/**
 * Creates a non-React resource (engine, media source, player) inside an
 * effect, disposes it in the cleanup and exposes the live instance to render
 * through an external store. Under Strict Mode the resource is created,
 * disposed and created again, leaving exactly one live instance.
 */
export function useOwnedResource<T>(
  create: () => T | null,
  dispose: (resource: T) => void,
  deps: DependencyList
): T | null {
  const [store] = useState(() => createResourceStore<T>())

  useEffect(() => {
    const resource = create()
    store.set(resource)
    return () => {
      if (resource !== null) dispose(resource)
      store.set(null)
    }
    // `create` and `dispose` are intentionally excluded; callers pass explicit deps.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [store, ...deps])

  return useSyncExternalStore(store.subscribe, store.get, getServerSnapshot)
}
