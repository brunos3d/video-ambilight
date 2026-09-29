import { useEffect, useRef, type RefObject } from 'react'

/**
 * A ref that always holds the latest value, updated after commit. Read it
 * inside effects and callbacks, never during render.
 */
export function useLatest<T>(value: T): RefObject<T> {
  const ref = useRef<T>(value)
  useEffect(() => {
    ref.current = value
  })
  return ref
}
