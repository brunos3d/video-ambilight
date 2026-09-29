import type { RefObject } from 'react'

/** An element, a ref object pointing at one, or nothing yet. */
export type ElementInput<E extends Element> = E | RefObject<E | null> | null | undefined

/**
 * Resolves an `ElementInput` to an element. Call this inside effects, after
 * commit, so ref objects are populated.
 */
export function resolveElement<E extends Element>(input: ElementInput<E>): E | null {
  if (!input) return null
  if (input instanceof Element) return input as E
  return (input as RefObject<E | null>).current
}
