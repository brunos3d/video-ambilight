// This is a workarond for the useUniqueId hook
// which is not available on older versions of React.

import * as React from 'react'

const wrappedUseId: () => string | null =
  typeof React.useId === 'function' ? React.useId : (): null => null

let counter = 0

export function useUniqueId(idFromParams: string | null = null): string {
  const idFromUseId = wrappedUseId()

  const idRef = React.useRef<string | null>(idFromParams || idFromUseId || null)
  if (idRef.current === null) {
    idRef.current = '' + counter++
  }

  return idFromParams ?? idRef.current
}

export default useUniqueId
