import { useState, type DependencyList } from 'react'
import type { FrameSource } from '@videoglow/core'
import { useOwnedResource } from './use-owned-resource'

/**
 * Creates a frame source for a DOM element once it is mounted and disposes it
 * when the element goes away or the dependencies change.
 *
 * Returns the source (null before mount) and a callback ref for the element.
 */
export function useFrameSource<E extends Element, S extends FrameSource>(
  create: (element: E) => S,
  deps: DependencyList = []
): [S | null, (element: E | null) => void] {
  const [element, setElement] = useState<E | null>(null)
  const source = useOwnedResource<S>(
    () => (element ? create(element) : null),
    (resource) => resource.dispose(),
    [element, ...deps]
  )
  return [source, setElement]
}
