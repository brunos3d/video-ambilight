# Migration from react-ambilight 1.x

## Summary

| 1.x                                                | 2.x                                                                                      |
| -------------------------------------------------- | ---------------------------------------------------------------------------------------- |
| `react-ambilight` (single package, YouTube only)   | `@videoglow/*` family. `react-ambilight` 2.x remains as a wrapper.                       |
| `import { VideoAmbilight } from 'react-ambilight'` | Still works. Recommended: `import { YouTubeAmbilight } from '@videoglow/react-youtube'`. |
| `import 'react-ambilight/dist/style.css'`          | Still resolves (empty file). Styles are inline now; remove the import when convenient.   |
| React 16.14 / 17 / 18                              | React 18 and 19.                                                                         |
| Next.js pages router demo                          | Next.js App Router example. Import from client components.                               |

## Compatibility package behavior

`react-ambilight@2` re-exports `VideoAmbilight` with the 1.x prop shape:

```tsx
<VideoAmbilight videoId="I5QDO6BsWnU" className="..." classNames={{ ambilight: '...' }} />
```

- `videoId`, `className` and every `classNames` key are honored.
- `classNames.ambilightVideo` is applied to the visible player host and
  `classNames.ambilight` to the glow host, as before.
- The default export is kept.
- `PlayerStates` is re-exported as a deprecated alias of `YouTubePlayerState`.
- The `YouTubePlayer`, `CustomEvent`, `EventType` and `RecursiveVoid` types
  are exported as deprecated aliases of the new typed interfaces.

## Breaking changes

- React 16 and 17 are no longer supported.
- The component no longer performs a per-animation-frame `seekTo`. Drift is
  corrected at most once per second. If you relied on the visual jitter of
  the old loop (unlikely), tune `sync.driftToleranceSeconds`.
- `setPlaybackQuality` is no longer called (it has been a no-op since 2019).
- The `youtube-player` dependency was dropped. The players you receive from
  `onReady` are the real `YT.Player` instances behind a typed controller.

## Recommended migration

```tsx
// before
import { VideoAmbilight } from 'react-ambilight'
import 'react-ambilight/dist/style.css'
;<VideoAmbilight videoId="I5QDO6BsWnU" />

// after
import { YouTubeAmbilight } from '@videoglow/react-youtube'
;<YouTubeAmbilight videoId="I5QDO6BsWnU" glow={{ blur: 80, opacity: 0.5, saturation: 3 }} />
```

For native video, which the old package did not support:

```tsx
import { VideoAmbilight } from '@videoglow/react-video'
;<VideoAmbilight src="/media/clip.webm" controls muted loop blur={60} />
```

## Deprecation timeline

- `react-ambilight@2.x`: wrapper, receives fixes only.
- A future major will publish a final version that logs a deprecation warning
  in development. It will not be removed from npm.
