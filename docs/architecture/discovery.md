# Discovery: the original video-ambilight implementation

This document records what the repository looked like before the monorepo
rewrite, how the original effect worked, and which parts were worth keeping.
It is the baseline the new architecture was validated against.

## Repository shape before the rewrite

```
docs/
  index.html          landing page with GitHub buttons (Bootstrap)
  canvas/             plain HTML demo: <video> + <canvas> + CSS blur
  youtube/            plain HTML demo: two YouTube iframes + CSS blur
  nextjs/             Next.js 11 pages-router demo consuming react-ambilight
packages/
  react-ambilight/    the npm package (Vite lib build, Storybook 8, CSS module)
```

There was no root `package.json`, no shared tooling, no tests, no CI and no
lockfile at the root. Each folder was an island with its own dependencies.
`docs/nextjs` pinned Next 11 and React 17 and needed
`NODE_OPTIONS=--openssl-legacy-provider` to build on a current Node.

## How the effect works

All three demos produce the glow the same way. A second, lower fidelity copy of
the video is placed behind the visible one, and a CSS `filter` is applied to
that copy:

```css
filter: blur(80px) opacity(0.5) saturate(300%);
transform: scale(1.1); /* 1.2 in the YouTube variants */
position: absolute;
inset: 0;
width: 100%;
height: 100%;
pointer-events: none;
z-index: -1;
```

Nothing reads pixels back into JavaScript. The blur runs on the compositor,
so the effect is cheap even at a large radius. That is the single most
important property of the original design and the new core keeps it.

### `docs/canvas` (HTMLVideoElement + canvas)

- On `play`, a `setInterval` at 30 fps calls
  `context.drawImage(video, 0, 0, video.videoWidth, video.videoHeight)`.
- On `pause` and `ended` the interval is cleared. On `seeked` a single repaint
  runs.
- The canvas is then stretched with CSS to fill the wrapper and blurred.

Problems found:

- The canvas is never resized. Its backing store stays at the default
  300x150. The frame is drawn at its intrinsic size (for example 1280x720),
  so only the top-left 300x150 crop of the video lands on the canvas. The blur
  hides this, but the glow does not represent the whole frame.
- The interval keeps running when the tab is hidden and while the video is
  stalled or buffering.
- `video.addEventListener('load', ...)` is not a media event. The first frame
  is drawn by an unconditional `repaintAmbilight()` call before metadata is
  available, which silently draws nothing.
- Nothing is cleaned up. The demo relies on page unload.

### `docs/youtube` (two YouTube IFrame players)

- Two `YT.Player` instances are created for the same `videoId`, one visible and
  one in a blurred container.
- The blurred container needs a transparent `box-shadow` to force the browser
  to allocate the overflow area for the iframe's blur. This is the "no-overflow
  bug" hack noted in the CSS.
- Synchronization is event based plus a `requestAnimationFrame` loop that
  calls `ambilight.seekTo(video.getCurrentTime())` on every animation frame.
  That is around 60 cross-origin `postMessage` calls per second and it makes
  the follower re-seek constantly. It produces visible stutter in the glow and
  wastes CPU.
- Quality is forced down with `setPlaybackQuality(lowest)` and the player is
  muted. `setPlaybackQuality`, `getPlaybackQuality` and
  `getAvailableQualityLevels` have been no-ops since 2019-10-24 according to
  the IFrame API revision history. The quality workaround is dead code.

### `packages/react-ambilight` (the npm package)

The component is a port of the YouTube demo into React with the
`youtube-player` npm wrapper.

Problems found:

- `youtube-player` returns promise based proxies. The component casts them
  `as unknown as YouTubePlayer` (a hand written synchronous type), then calls
  `videoPlayer.getCurrentTime()` in the animation loop and passes the result to
  `seekTo`. The result is a `Promise`, not a number. The per-frame sync loop
  therefore never seeks anywhere. Only the `stateChange` handlers (which use
  `event.target`, the real player) do any synchronization.
- Players are created in an effect and never destroyed. Listeners are added in
  another effect with no cleanup. Under React Strict Mode two sets of players
  are created and the first set leaks.
- The per-frame `seekTo` loop is scheduled through a custom `useAnimationFrame`
  hook whose `animate` closure captures the first render's callback.
- A `console.log(videoPlayer)` ships in the published bundle.
- `useUniqueId` reimplements `React.useId` for React 16 support.
- The public type file `src/types/youtube-player.ts` duplicates
  `docs/nextjs/src/types.ts` line for line, and both use `any`.
- The package exports a single ES bundle plus a `dist/style.css` that consumers
  must import by deep path.
- The Storybook setup contains one story with no configuration coverage.

## What the original does well

- It never tries to read YouTube pixels. Cross-origin iframe content cannot be
  drawn to a canvas, so the "second player behind a CSS filter" approach is
  the only viable way to build the glow for YouTube. The new architecture
  keeps this technique and makes the synchronization explicit.
- The CSS filter pipeline is the right rendering choice. Blur on the
  compositor is far cheaper than a JavaScript blur and it also works on a
  canvas tainted by cross-origin video, because tainting only blocks reading
  pixels back (`getImageData`, `toDataURL`), not drawing to or displaying the
  canvas.
- The visual parameters (blur 80px, opacity 0.5, saturate 300%, scale
  1.1/1.2) are a good default and are preserved as the new defaults.

## Classification of the old code

| Concern                                          | Old location                            | New home                                                                             |
| ------------------------------------------------ | --------------------------------------- | ------------------------------------------------------------------------------------ |
| Draw frame to canvas, blur with CSS              | `docs/canvas/main.js`, CSS              | `@videoglow/core` (renderer + glow style)                                            |
| Frame scheduling (`setInterval` 30 fps)          | `docs/canvas/main.js`                   | `@videoglow/core` (frame clock) and `@videoglow/video` (`requestVideoFrameCallback`) |
| Media event handling (play/pause/seeked)         | `docs/canvas/main.js`                   | `@videoglow/video`                                                                   |
| Two YouTube players + sync                       | `docs/youtube/main.js`, React component | `@videoglow/youtube` (typed API loader, player controller, coordinator)              |
| Iframe glow CSS and overflow hack                | `styles.css`, CSS module                | `@videoglow/core` glow style, consumed by `@videoglow/youtube`                       |
| React lifecycle                                  | `VideoAmbilight/index.tsx`              | `@videoglow/react`, `@videoglow/react-video`, `@videoglow/react-youtube`             |
| `VideoAmbilight` props (`videoId`, `classNames`) | `react-ambilight`                       | `react-ambilight` compatibility wrapper over `@videoglow/react-youtube`              |
| Next.js demo                                     | `docs/nextjs` (pages router, Next 11)   | `apps/examples` (App Router, Next 16)                                                |
| Plain HTML demos                                 | `docs/canvas`, `docs/youtube`           | `/core` and `/youtube` routes in the examples app plus Storybook fixtures            |

Obsolete and removed:

- `setPlaybackQuality` based "optimization" (API is a no-op).
- Per-animation-frame `seekTo` loop.
- `youtube-player` dependency and the `as unknown as` casts.
- `useUniqueId` (React 18+ has `useId`; the new packages target React 18 and 19).
- Bootstrap landing page and GitHub buttons script.
- `NODE_OPTIONS=--openssl-legacy-provider` scripts.
