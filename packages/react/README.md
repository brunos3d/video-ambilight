# @videoglow/react

React bindings for the `@videoglow/core` engine. Depends on core only; pair it
with a source package or your own `FrameSource`.

## Install

```bash
pnpm add @videoglow/react @videoglow/core
```

React 18.2 and 19. Every export is a client component (`'use client'`).

## `<Ambilight>`

```tsx
'use client'
import { createCanvasSource } from '@videoglow/canvas'
import { Ambilight, useFrameSource } from '@videoglow/react'

export function Visualizer() {
  const [source, ref] = useFrameSource((el: HTMLCanvasElement) => createCanvasSource(el))
  return (
    <Ambilight source={source} blur={70} fps={30} resolution={160}>
      <canvas ref={ref} width={640} height={360} />
    </Ambilight>
  )
}
```

Renders a positioned wrapper, mounts the glow canvas as its first child and
keeps children in normal flow above it. Props: every core option (`blur`,
`opacity`, `saturation`, `brightness`, `scale`, `fps`, `resolution`,
`pauseWhenHidden`, `pauseWhenOffscreen`), `enabled`, `glowClassName`,
`createRenderer`, plus any `div` attributes. The `ref` handle exposes
`getAmbilight()` and `getElement()`.

## Hooks

- `useFrameSource(create, deps)` returns `[source, ref]`. The source is created
  after the element mounts and disposed on unmount or when `deps` change.
- `useAmbilight({ container, source, ...options })` owns an engine and
  returns it. The engine is recreated only when the container, the source or
  `createRenderer` change; other options go through `update()`.
- `useAmbilightState(ambilight)` returns live statistics through
  `useSyncExternalStore`.
- `useOwnedResource(create, dispose, deps)` is the lifecycle primitive the
  hooks are built on: create in an effect, dispose in the cleanup, expose to
  render. It is exported for custom integrations.

All hooks leave exactly one live instance under Strict Mode.

## License

MIT
