# @videoglow/react-youtube

`YouTubeAmbilight`: a YouTube player with a synchronized, blurred second player
behind it.

## Install

```bash
pnpm add @videoglow/react-youtube
```

Pulls in `@videoglow/react`, `@videoglow/youtube` and `@videoglow/core`.
React 18.2 and 19. Loads `https://www.youtube.com/iframe_api` at runtime.

## Usage

```tsx
'use client'
import { useRef } from 'react'
import { YouTubeAmbilight, type YouTubeAmbilightHandle } from '@videoglow/react-youtube'

export function Player() {
  const handle = useRef<YouTubeAmbilightHandle>(null)
  return (
    <YouTubeAmbilight
      ref={handle}
      videoId="ASzOzrB-a9E"
      playerVars={{ rel: 0 }}
      glow={{ blur: 80, opacity: 0.5, saturation: 3, scale: 1.2 }}
      sync={{ driftToleranceSeconds: 0.25, checkIntervalMs: 1000 }}
      onReady={(instance) => instance.leader.play()}
      onCoordinatorEvent={(event) => console.log(event)}
    />
  )
}
```

- Changing `videoId` loads the new video into both players.
- Changing `playerVars`, `followerPlayerVars`, `classNames` or `host`
  recreates the players.
- `glow` and `sync` changes are applied in place.
- The handle exposes `getInstance()`, `getLeader()`, `getFollower()`,
  `getCoordinator()` and `getElement()`.

`useYouTubeAmbilight({ container, videoId, ... })` is the hook behind the
component.

## License

MIT
