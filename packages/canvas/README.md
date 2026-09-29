# @videoglow/canvas

Canvas and image frame sources for `@videoglow/core`.

## Install

```bash
pnpm add @videoglow/core @videoglow/canvas
```

## Usage

```ts
import { createAmbilight } from '@videoglow/core'
import { createCanvasSource, createImageSource } from '@videoglow/canvas'

// A canvas that animates: sampled on the animation loop while active.
const live = createCanvasSource(canvas, { mode: 'continuous' })
live.setActive(false) // pause sampling

// A canvas you redraw occasionally: render when you say so.
const chart = createCanvasSource(canvas, { mode: 'manual' })
drawChart(canvas)
chart.invalidate()

// A static image, ImageBitmap, OffscreenCanvas or VideoFrame.
const poster = createImageSource(imageElement)
poster.setImage(otherBitmap)

const ambilight = createAmbilight({ container, source: live })
```

`HTMLCanvasElement` and `OffscreenCanvas` are accepted. Image elements that
have not loaded yet are rendered when their `load` event fires.

## License

MIT
