# @videoglow/youtube

YouTube IFrame Player integration for videoglow.

Browsers never expose the pixels of a cross-origin iframe, so this package does
not feed the canvas renderer. It runs a second, muted YouTube player behind the
visible one, applies the same glow CSS that `@videoglow/core` generates, and
keeps the two players aligned with an explicit synchronization policy.

Live examples and documentation: https://videoglow.brunosilva.io

## Install

```bash
# npm
npm install @videoglow/core @videoglow/youtube

# pnpm
pnpm add @videoglow/core @videoglow/youtube

# yarn
yarn add @videoglow/core @videoglow/youtube

# bun
bun add @videoglow/core @videoglow/youtube
```

## Usage

```ts
import { createYouTubeAmbilight } from '@videoglow/youtube'

const ambilight = createYouTubeAmbilight(container, {
  videoId: 'I5QDO6BsWnU',
  playerVars: { rel: 0 },
  glow: { blur: 80, opacity: 0.5, saturation: 3, scale: 1.2 },
  sync: { driftToleranceSeconds: 0.25, checkIntervalMs: 1000 },
})

await ambilight.ready
ambilight.coordinator.subscribe((event) => console.log(event))
ambilight.coordinator.getSnapshot() // states, times, drift, corrections
ambilight.loadVideo('otherId')
ambilight.update({ blur: 40 })
ambilight.dispose()
```

## Building blocks

| Export                                                             | Purpose                                                                          |
| ------------------------------------------------------------------ | -------------------------------------------------------------------------------- |
| `loadYouTubeIframeApi()`                                           | Loads the API script once per window and resolves the typed `YT` namespace.      |
| `createYouTubePlayer(host, options)`                               | One player with a synchronous typed surface, a `ready` promise and typed events. |
| `createPlaybackCoordinator(leader, follower, policy)`              | Leader/follower synchronization.                                                 |
| `createYouTubeAmbilight(container, options)`                       | Wires the DOM, both players and the coordinator.                                 |
| `YouTubePlayerState`, `YouTubePlayerVars`, `YouTubePlayerInstance` | Typed subset of the IFrame API.                                                  |

## Synchronization policy

| Option                    | Default | Meaning                                                 |
| ------------------------- | ------- | ------------------------------------------------------- |
| `driftToleranceSeconds`   | 0.25    | Drift that triggers a corrective seek                   |
| `checkIntervalMs`         | 1000    | Drift check period while the leader plays               |
| `seekLeadSeconds`         | 0       | Added to corrective seeks to compensate command latency |
| `mirrorPlaybackRate`      | true    | Mirror `setPlaybackRate`                                |
| `pauseWhileLeaderBuffers` | true    | Pause the follower while the leader buffers             |

The leader is never commanded. Leader `PLAYING`, `PAUSED`, `BUFFERING` and
`ENDED` are mirrored through events. While playing, drift is measured every
`checkIntervalMs` and corrected with at most one seek per check.

## Limitations

- The follower downloads the stream a second time. YouTube removed quality
  control from the API in 2019.
- Scripted playback needs the follower to be muted (it always is) and works
  once the user has started the leader.
- Error 153 means the embed request had no `Referer`; pages served with a
  strict referrer policy must relax it for youtube.com.

## License

MIT
