# @videoglow/core

Framework-agnostic Ambilight engine. Samples frames from any `FrameSource`
into a small canvas and lets CSS blur it on the compositor.

Part of [videoglow](https://github.com/brunos3d/video-ambilight). No
dependencies. Browser only at runtime, safe to import on the server.

Live examples and documentation: https://videoglow.brunosilva.io

## Install

```bash
# npm
npm install @videoglow/core

# pnpm
pnpm add @videoglow/core

# yarn
yarn add @videoglow/core

# bun
bun add @videoglow/core
```

You also need a source package (`@videoglow/video`, `@videoglow/canvas`) or
your own `FrameSource` implementation.

## Usage

```ts
import { createAmbilight } from '@videoglow/core'
import { createVideoSource } from '@videoglow/video'

const video = document.querySelector('video')!
const source = createVideoSource(video)
const ambilight = createAmbilight({
  container: video.parentElement!, // becomes position: relative; isolation: isolate
  source,
  blur: 80,
  opacity: 0.5,
  saturation: 3,
  scale: 1.15,
  fps: 30,
  resolution: 160,
})

ambilight.update({ blur: 40 })
ambilight.setSource(otherSource)
ambilight.getState() // { running, sampling, framesRendered, bufferWidth, averageRenderDurationMs, ... }
ambilight.subscribe((event) => {
  /* start, stop, render, samplingchange, visibilitychange, error, dispose */
})
ambilight.dispose() // stops, unmounts the canvas; does not dispose the source
```

## Concepts

- `FrameSource`: provides `getFrame()`, `isActive()` and events. Push sources
  emit `frame` events (video with `requestVideoFrameCallback`); pull sources
  are polled on the animation loop while active (canvas, video fallback).
- `GlowRenderer`: turns frames into a visible layer. `createCanvasGlowRenderer`
  is the default; a WebGL renderer can implement the same interface and be
  passed through the `renderer` option.
- Frame clock: caps sampling at `fps` regardless of source rate.
- Visibility gate: stops sampling in hidden tabs and off screen.
- Glow style helpers (`resolveGlowStyle`, `glowStyleToCss`, `applyGlowStyle`)
  are shared with the YouTube integration.

## Writing a source

```ts
import { createEmitter, type FrameSource, type FrameSourceEvent } from '@videoglow/core'

export function createBitmapSource(bitmap: ImageBitmap): FrameSource {
  const emitter = createEmitter<FrameSourceEvent>()
  return {
    kind: 'bitmap',
    mode: 'pull',
    getFrame: () => ({ image: bitmap, width: bitmap.width, height: bitmap.height }),
    isActive: () => false,
    subscribe: (listener) => emitter.subscribe(listener),
    dispose: () => emitter.clear(),
  }
}
```

Emit `invalidate` to render once, `active` / `idle` to start and stop
continuous sampling, `resize` when dimensions change and `clear` when the
content goes away.

## License

MIT
