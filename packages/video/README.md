# @videoglow/video

`HTMLVideoElement` frame source for `@videoglow/core`.

- Uses `requestVideoFrameCallback` when available (Chrome 83, Safari 15.4,
  Firefox 132) so the glow updates exactly when a frame is presented.
- Falls back to animation-frame polling on older browsers, and switches to it
  automatically when the callback never fires (Safari with DRM).
- Handles `play`, `pause`, `ended`, `waiting`, `seeked`, `loadedmetadata`,
  `resize`, `emptied` and `error`.

Live examples and documentation: https://videoglow.brunosilva.io

## Install

```bash
# npm
npm install @videoglow/core @videoglow/video

# pnpm
pnpm add @videoglow/core @videoglow/video

# yarn
yarn add @videoglow/core @videoglow/video

# bun
bun add @videoglow/core @videoglow/video
```

## Usage

```ts
import { createAmbilight } from '@videoglow/core'
import { createVideoSource } from '@videoglow/video'

const source = createVideoSource(video, {
  videoFrameCallback: true, // default: use rVFC when supported
  frameCallbackTimeoutMs: 1000, // fallback watchdog
})
const ambilight = createAmbilight({ container, source })

// later
ambilight.dispose()
source.dispose()
```

Nothing is rendered until the video has data (`readyState >= 2`) and non-zero
dimensions. A paused video renders once after each seek.

For React use `@videoglow/react-video`.

## License

MIT
