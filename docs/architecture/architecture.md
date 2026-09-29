# Architecture

This is the design the monorepo implements. `discovery.md` explains where the
project came from, `browser-research.md` lists the platform facts the design
relies on, `package-naming.md` explains the npm scope and `migration.md`
covers the path from `react-ambilight` 1.x.

## Goals

1. A framework-agnostic engine that turns any drawable frame source into a
   glow behind the source.
2. Media integrations (native video, canvas, YouTube) that plug into that
   engine without the engine knowing about them.
3. React as a thin lifecycle layer, usable from Next.js client components.
4. A renderer boundary so that the canvas renderer can be replaced (for
   example by WebGL) without touching integrations.
5. Explicit, observable, testable synchronization for YouTube.
6. Strict package boundaries enforced by tooling, not by convention.

## Package graph

```
apps/examples ──────────┐
apps/storybook ─────────┤
                        ▼
react-ambilight ──▶ @videoglow/react-youtube ──▶ @videoglow/youtube ──▶ @videoglow/core
                    @videoglow/react-video ────▶ @videoglow/video ────▶ @videoglow/core
                    │                            @videoglow/canvas ───▶ @videoglow/core
                    └──────────────────────────▶ @videoglow/react ────▶ @videoglow/core
```

Dependency rules (enforced by `@nx/enforce-module-boundaries` through project
tags):

| Tag                  | Projects                          | May depend on                               |
| -------------------- | --------------------------------- | ------------------------------------------- |
| `layer:core`         | core                              | nothing                                     |
| `layer:source`       | video, canvas, youtube            | `layer:core`                                |
| `layer:react`        | react                             | `layer:core`                                |
| `layer:react-source` | react-video, react-youtube        | `layer:react`, `layer:source`, `layer:core` |
| `layer:compat`       | react-ambilight                   | `layer:react-source`                        |
| `layer:app`          | examples, storybook, examples-e2e | anything                                    |

`peerDependencies` express the same graph at install time. `@videoglow/core`
has no dependencies. React is a peer dependency of the React packages only.

## Runtime flow

```
FrameSource ──(frame | active | idle | invalidate | resize | clear)──▶ Ambilight engine
                                                                          │
                                                   frame clock (fps cap)  │  visibility gate
                                                                          ▼
                                                                    GlowRenderer.render(frame)
                                                                          │
                                                         canvas backing store (small) + CSS filter
```

1. A `FrameSource` wraps a media object. It knows how to obtain the current
   drawable (`getFrame()`), whether continuous sampling is wanted
   (`isActive()`), and notifies the engine about changes. Two modes exist:
   - `push`: the source emits a `frame` event whenever a new frame is
     presented. `@videoglow/video` uses `requestVideoFrameCallback`.
   - `pull`: the source has no frame notification. The engine runs a
     `requestAnimationFrame` loop while the source is active.
     `@videoglow/canvas` in `continuous` mode and the video fallback use this.
2. The engine applies a frame clock (`fps`, default 30) so that sampling never
   exceeds the configured rate regardless of source mode, and a visibility gate
   (document hidden, element off screen) so nothing renders when nobody can
   see it.
3. The `GlowRenderer` draws the frame into a small canvas. Buffer size is
   derived from the frame's intrinsic aspect ratio and the `resolution`
   option (default 160 px on the long edge, clamped to at least 2 px). The
   canvas element is stretched to cover its container with CSS.
4. The glow style (`blur`, `opacity`, `saturation`, `brightness`, `scale`)
   is applied as CSS `filter` and `transform`. Updating the style never
   re-renders a frame.

The engine is a plain object with an explicit lifecycle:

```ts
const ambilight = createAmbilight({ source, container, blur: 80, fps: 30 })
ambilight.start()
ambilight.update({ blur: 40, saturation: 2 })
ambilight.setSource(otherSource)
ambilight.getState()   // { running, framesRendered, lastRenderMs, bufferWidth, bufferHeight, ... }
ambilight.subscribe((event) => { ... })
ambilight.dispose()
```

`renderer` is injectable. The default is `createCanvasGlowRenderer`. A future
WebGL renderer implements the same `GlowRenderer` interface and is passed in
through the same option; no integration changes.

## Core module map (`packages/core/src`)

| Module                         | Responsibility                                                                                                                                                  |
| ------------------------------ | --------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `types.ts`                     | Public interfaces: `Frame`, `FrameSource`, `FrameSourceEvent`, `GlowRenderer`, `GlowStyle`, `SamplingOptions`, `Ambilight`, `AmbilightState`, `AmbilightEvent`. |
| `glow-style.ts`                | Defaults, `resolveGlowStyle`, `glowStyleToCss`, `applyGlowStyle`. Shared with the YouTube package.                                                              |
| `buffer-size.ts`               | `resolveBufferSize(frameSize, resolution)`.                                                                                                                     |
| `frame-clock.ts`               | Fixed-rate gate over any scheduler (`shouldRender(now)`).                                                                                                       |
| `visibility-gate.ts`           | `document.visibilityState` and `IntersectionObserver` gating.                                                                                                   |
| `canvas-glow-renderer.ts`      | Default renderer.                                                                                                                                               |
| `ambilight.ts`                 | The engine (`createAmbilight`).                                                                                                                                 |
| `emitter.ts`, `environment.ts` | Tiny typed emitter and `isBrowser()` guards.                                                                                                                    |

Nothing in core imports React, YouTube or any media-specific event names.

## Sources

### `@videoglow/video`

`createVideoSource(video, options)` returns a `FrameSource` bound to an
`HTMLVideoElement`.

- `loadedmetadata` and `resize` emit `resize`.
- `playing` emits `active`; `pause`, `ended`, `waiting`, `stalled`, `suspend`
  while not playing, and `error` emit `idle`.
- `seeked`, `loadeddata`, `timeupdate` (while paused) and `ratechange` emit
  `invalidate` so a paused video still shows the correct glow after a seek.
- `emptied` emits `clear`.
- Scheduling: `requestVideoFrameCallback` when available. A watchdog switches
  the source to `pull` mode if playback started but no video frame callback
  arrived within one second (Safari with DRM, some WebViews).
- `getFrame()` returns null until `readyState >= HAVE_CURRENT_DATA` and
  `videoWidth > 0`, which covers zero-dimension and metadata-only states.
- Autoplay restrictions are not the source's concern; a blocked video is
  simply idle until the user plays it.

### `@videoglow/canvas`

- `createCanvasSource(canvas, { mode: 'continuous' | 'manual' })`. Continuous
  sources are active until `setActive(false)`; manual sources render when the
  consumer calls `invalidate()` after drawing. Accepts `HTMLCanvasElement` and
  `OffscreenCanvas`.
- `createImageSource(image)` for `ImageBitmap`, `HTMLImageElement` and
  `VideoFrame`: renders once and on `invalidate()`.

## YouTube

Cross-origin iframe pixels are not readable, so the YouTube integration does
not produce frames for the canvas renderer. It runs a second, muted YouTube
player under the same glow CSS that core generates and keeps it in sync with
the visible player. The package is split into layers that are individually
testable:

| Layer             | Module                         | Responsibility                                                                                                                                            |
| ----------------- | ------------------------------ | --------------------------------------------------------------------------------------------------------------------------------------------------------- |
| API loader        | `iframe-api/loader.ts`         | Idempotent script injection, chains an existing `onYouTubeIframeAPIReady`, returns `Promise<YouTubeIframeApi>`. Injectable `document`/`window` for tests. |
| Types             | `iframe-api/types.ts`          | Narrow typed interface of the IFrame API subset in use. No `any`.                                                                                         |
| Player controller | `player/player-controller.ts`  | Wraps one `YT.Player`: `ready` promise, typed events, synchronous state getters, `destroy()`.                                                             |
| Coordinator       | `sync/playback-coordinator.ts` | Leader/follower synchronization with an explicit policy.                                                                                                  |
| Mount             | `create-youtube-ambilight.ts`  | Builds the DOM, creates both players, applies the glow style, exposes `dispose()`.                                                                        |

### Synchronization design

The visible player is the **leader** and the authoritative clock. The glow
player is the **follower**. The coordinator never drives the leader.

Event driven mirroring (one call per leader event):

| Leader event           | Follower action                                                      |
| ---------------------- | -------------------------------------------------------------------- |
| `PLAYING`              | align time if drift exceeds tolerance, then `playVideo()`            |
| `PAUSED`               | `pauseVideo()`, then align time so the paused glow matches the frame |
| `BUFFERING`            | `pauseVideo()` (policy `pauseWhileLeaderBuffers`, default on)        |
| `ENDED`                | `pauseVideo()`, align to leader time                                 |
| `CUED`, `UNSTARTED`    | nothing                                                              |
| `playbackRateChange`   | `setPlaybackRate(rate)` (policy `mirrorPlaybackRate`, default on)    |
| leader `loadVideoById` | follower `loadVideoById` (through the mount API)                     |

Drift correction (periodic, only while the leader is playing):

- Every `checkIntervalMs` (default 1000) the coordinator reads both clocks.
  `drift = leaderTime - followerTime`.
- If the follower is not playing while the leader is, `playVideo()` is
  issued (covers autoplay block recovery and follower buffering).
- If `|drift| > driftToleranceSeconds` (default 0.25), one `seekTo(leaderTime
  - seekLeadSeconds, true)`is issued.`seekLeadSeconds` (default 0) can
    compensate the postMessage round trip on slow devices.
- At most one corrective seek per check. There is no per-frame work.

Observability: `coordinator.subscribe()` receives `state-mirrored`,
`rate-mirrored`, `drift-checked`, `drift-corrected`, `follower-autoplay-blocked`
and `error` events. `coordinator.getSnapshot()` returns both states, both
times, the last drift and the correction count. The examples site shows this
live.

Player recreation: the mount API owns both controllers. `loadVideo(id)` reuses
the players. `dispose()` destroys both and stops the interval. A React remount
creates a fresh mount; nothing is cached globally except the API script
promise, which is keyed on the `window` object.

## React

`@videoglow/react` depends only on core:

- `<Ambilight source={source} blur={..}>children</Ambilight>` renders a
  positioned wrapper, mounts the engine in an effect and disposes it in the
  cleanup. Option props map to `update()`; only `source` and `renderer`
  changes recreate the engine.
- `useAmbilight({ container, source, ...options })` for consumers who own the
  markup.
- `useFrameSource(create)` returns `[source, ref]` and handles the "element
  exists only after mount" problem: the callback ref stores the element in
  state, an effect creates the source and disposes it on cleanup. Works under
  Strict Mode and when the element is swapped.
- `useOwnedResource(create, dispose, deps)` is the primitive under both
  hooks: the resource is created in an effect, disposed in the cleanup and
  exposed to render through `useSyncExternalStore`. This keeps the hooks free
  of setState-in-effect and ref-in-render patterns flagged by the React
  Compiler lint rules.
- `useAmbilightState(ambilight)` uses `useSyncExternalStore` for live stats.
  The engine emits `samplingchange` events so the store refreshes when the
  source goes idle without rendering.

`@videoglow/react-video` adds `<VideoAmbilight>` (renders the `<video>`,
forwards the element ref, spreads video attributes) and `useVideoSource()`.

`@videoglow/react-youtube` adds `<YouTubeAmbilight>` and
`useYouTubeAmbilight()`.

All React entry files start with `'use client'`. Module evaluation touches no
browser globals.

## Next.js

`apps/examples` is a Next.js 16 App Router application. Pages are server
components that render small client components which use the packages. The
site doubles as documentation and as the Playwright test target. It deploys
to Vercel with `apps/examples` as the project root directory; see
`docs/deployment.md`.

## Build

- Libraries build with `tsup` (ESM + CJS, declaration files, source maps)
  from a shared factory in `tools/tsup/base.ts`. `'use client'` is emitted as
  a banner for the React packages.
- `exports` maps `.` to `import`/`require`/`types` conditions. No other entry
  points except `react-ambilight/dist/style.css`, kept for compatibility.
- `sideEffects: false` on every package.
- Nx orchestrates `build`, `typecheck`, `lint`, `test`, `e2e`,
  `build-storybook` with `dependsOn: ^build` and caching.

## Testing

| Level   | Tool                                                   | Scope                                                                                                                                                                                                                                        |
| ------- | ------------------------------------------------------ | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Unit    | Vitest + jsdom                                         | core (clock, buffer size, style, engine lifecycle with stub renderer), video source (fake video element), canvas source, YouTube loader/controller/coordinator (fake IFrame API), React hooks and components (Testing Library, Strict Mode). |
| Browser | Playwright against the built examples app              | real `<video>` and canvas drawing, buffer sizing, frame counters, YouTube mount and coordinator snapshot (network permitting), screenshots of the glow.                                                                                      |
| Visual  | Playwright `toHaveScreenshot` on the `/baseline` route | new pipeline compared with a reproduction of the original CSS pipeline on the same frame.                                                                                                                                                    |

Media fixture: a deterministic test pattern video generated with `ffmpeg`
(`testsrc2`), checked in under `apps/examples/public/media`. No network
access is needed for non-YouTube tests.

## Publishing

`nx release` with conventional commits, fixed versioning across the
`@videoglow/*` group, `react-ambilight` released alongside as a compatibility
package. The release workflow is manual dispatch and dry-runs by default until
an `NPM_TOKEN` secret exists. See `docs/releasing.md`.

## Open risks

- YouTube embeds cannot be exercised deterministically in CI. The e2e suite
  runs the YouTube page but only asserts mount structure and coordinator
  wiring; time based assertions are skipped when the network is unavailable.
- The follower iframe downloads the same stream a second time. There is no
  supported way to request a lower quality, so the cost is one extra embed.
- `filter: blur()` on an iframe is clipped by some engines unless the layer has
  slack. The transparent `box-shadow` on the iframe host stays for that reason.
- Safari with DRM streams never fires `requestVideoFrameCallback`; the
  watchdog fallback covers it but has not been verified on real hardware.
