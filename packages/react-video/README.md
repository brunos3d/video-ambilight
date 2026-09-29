# @videoglow/react-video

`VideoAmbilight`: a `<video>` element with an Ambilight glow behind it.

## Install

```bash
pnpm add @videoglow/react-video
```

Pulls in `@videoglow/react`, `@videoglow/video` and `@videoglow/core`.
React 18.2 and 19.

## Usage

```tsx
'use client'
import { VideoAmbilight } from '@videoglow/react-video'

export function Player() {
  return (
    <VideoAmbilight
      src="/clip.webm"
      controls
      muted
      loop
      autoPlay
      playsInline
      blur={80}
      opacity={0.5}
      saturation={3}
      fps={30}
      resolution={160}
      className="player" // wrapper
      videoClassName="rounded" // <video>
      ambilightRef={(engine) => console.log(engine?.getState())}
    />
  )
}
```

Video attributes and event handlers are forwarded to the element; `ref`
points at the `HTMLVideoElement`. `enabled={false}` stops rendering without
unmounting.

`useVideoSource(options)` returns `[source, ref]` for use with
`<Ambilight>` or `useAmbilight` from `@videoglow/react` when you own the
markup.

## License

MIT
