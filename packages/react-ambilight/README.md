# react-ambilight

Compatibility package for `react-ambilight` 1.x. Version 2 keeps the 1.x
component API and implements it on top of
[`@videoglow/react-youtube`](https://www.npmjs.com/package/@videoglow/react-youtube).

New projects should install `@videoglow/react-youtube` directly.

## Install

```bash
pnpm add react-ambilight
```

React 18.2 and 19 (React 16 and 17 are no longer supported).

## Usage (unchanged)

```tsx
import { VideoAmbilight } from 'react-ambilight'
import 'react-ambilight/dist/style.css' // optional; the file is now empty

export default function App() {
  return <VideoAmbilight videoId="dQw4w9WgXcQ" />
}
```

`className` and the `classNames` object (`videoWrapper`, `ambilightWrapper`,
`aspectRatio`, `ambilight`, `ambilightVideo`) are honored as before.

## What changed in 2.0

- Synchronization no longer seeks on every animation frame. Drift is checked
  once per second and corrected only above 0.25 s. Tune it through
  `@videoglow/react-youtube` if needed.
- Players and listeners are destroyed on unmount. Strict Mode leaves one pair
  of players.
- `youtube-player` is no longer a dependency.
- `PlayerStates`, `YouTubePlayer`, `CustomEvent`, `EventType` and
  `RecursiveVoid` are exported as deprecated aliases of the typed
  `@videoglow/youtube` API.

See the [migration guide](https://github.com/brunos3d/video-ambilight/blob/main/docs/architecture/migration.md).

## License

MIT
