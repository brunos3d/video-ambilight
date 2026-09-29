import type { Listener, Unsubscribe } from './types'

export interface Emitter<T> {
  emit(event: T): void
  subscribe(listener: Listener<T>): Unsubscribe
  clear(): void
  readonly size: number
}

/** Minimal synchronous event emitter. Listeners may unsubscribe during dispatch. */
export function createEmitter<T>(): Emitter<T> {
  const listeners = new Set<Listener<T>>()
  return {
    emit(event) {
      for (const listener of Array.from(listeners)) {
        if (listeners.has(listener)) listener(event)
      }
    },
    subscribe(listener) {
      listeners.add(listener)
      return () => {
        listeners.delete(listener)
      }
    },
    clear() {
      listeners.clear()
    },
    get size() {
      return listeners.size
    },
  }
}
