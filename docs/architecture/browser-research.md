# Browser and platform research

Findings that shaped the architecture. Versions were checked against MDN,
caniuse and the YouTube IFrame API documentation in September 2026.

## Reading video pixels: what a canvas is allowed to do

- `drawImage(video, ...)` works for any playing `HTMLVideoElement`, including
  cross-origin media served without CORS headers. The canvas becomes
  "tainted" in that case.
- A tainted canvas can still be drawn to, displayed, transformed and filtered
  with CSS. Only `getImageData`, `toDataURL`, `toBlob`, `captureStream` and
  `createImageBitmap` from the canvas are blocked.
- Because the glow pipeline never reads pixels back, the effect works for
  cross-origin video without `crossorigin="anonymous"`. Consumers who want to
  read colors themselves (for example to drive LEDs) need CORS enabled media.
- Content inside a cross-origin `<iframe>` (YouTube) is never drawable. There
  is no API that exposes iframe pixels to the embedding page. The YouTube
  integration therefore cannot feed the canvas renderer and must use a
  second player under a CSS filter. This is a hard platform constraint, not a
  workaround.

## Frame scheduling

| API                         | Chrome | Edge | Firefox       | Safari | Used for                                |
| --------------------------- | ------ | ---- | ------------- | ------ | --------------------------------------- |
| `requestVideoFrameCallback` | 83     | 83   | 132 (2024-10) | 15.4   | Primary scheduler for `<video>` sources |
| `requestAnimationFrame`     | all    | all  | all           | all    | Fallback scheduler and canvas sources   |
| `setInterval`               | all    | all  | all           | all    | Not used for rendering                  |

`requestVideoFrameCallback` (rVFC) fires once per presented video frame, with
`mediaTime`, `presentedFrames` and the frame size. It is Baseline 2024. It does
not fire when the video is paused, stalled or when the tab is hidden, which
removes the need for most manual gating. Known limitation: Safari does not
fire it for DRM protected streams; the video source falls back to
`requestAnimationFrame` when no callback arrives after playback starts.

The core applies a frame clock on top of either scheduler so that consumers can
cap the effective sampling rate (default 30 fps). A 60 fps video does not need
a 60 fps glow, and capping halves the draw calls.

## Canvas and image APIs

- `CanvasRenderingContext2D` with a small backing store is the renderer.
  Drawing a 1920x1080 frame into a 160x90 canvas is a single GPU scaled blit.
  A blur of 80px afterwards hides all detail, so the small buffer is visually
  indistinguishable from a full size one. Measured on the examples page it
  reduced per-frame draw time to under 0.1 ms on a laptop iGPU.
- `OffscreenCanvas` and `ImageBitmap` are supported everywhere (Firefox 105,
  Safari 16.4) and are accepted as frame sources. The renderer does not use an
  `OffscreenCanvas` for output because the output must be a DOM element that
  CSS can filter.
- `CanvasRenderingContext2D.filter` is not used. CSS `filter` on the canvas
  element runs on the compositor, is universally supported, and works on
  tainted canvases. It also decouples blur cost from the sampling rate: the
  blur is recomputed only when the compositor needs it.
- `VideoFrame` and WebCodecs were evaluated and rejected. `drawImage` already
  accepts an `HTMLVideoElement` and a `VideoFrame`; decoding ourselves would
  add complexity, cost and a second copy of the media without any visual
  benefit for a blur.
- Mobile Safari has a limit on the number and total memory of canvases. Small
  buffers keep this a non issue.
- The glow canvas must not use a `desynchronized` 2D context. Chrome may scan
  a desynchronized canvas out through a hardware overlay plane, which skips
  the compositor and therefore the CSS blur. On screen the raw canvas
  rectangle appears unblurred and out of sync with the glow, while screen
  captures, which read the compositor output, look correct. Found on Linux
  with a discrete GPU during visual testing.

## Layout and visibility

- `ResizeObserver` is used only to observe the container so that the glow
  keeps covering the source when the source resizes. The canvas backing store
  is sized from the frame's intrinsic dimensions, not from layout.
- `IntersectionObserver` pauses sampling when the glow is fully off screen.
- `document.visibilitychange` pauses the fallback animation loop. rVFC and
  rAF already stop when the document is hidden.
- CSS `filter: blur()` on an element is clipped to the element's layer bounds
  unless the layer has room to grow. The original demos used a transparent
  `box-shadow` on the iframe wrapper to enlarge the layer. The new glow style
  keeps `transform: scale()` for the visual spill and uses `overflow: visible`
  on the wrapper. Applying the filter to a canvas needs no shadow hack;
  the iframe host in the YouTube package keeps a transparent `box-shadow`
  because some engines still clip filtered iframe layers otherwise.

## YouTube IFrame Player API (2026)

Verified against the reference and revision history (last updated
2026-09-15).

- Loading: `https://www.youtube.com/iframe_api` injects the player script and
  calls a global `onYouTubeIframeAPIReady`. The loader in `@videoglow/youtube`
  is idempotent, chains any existing callback and resolves a promise, so
  several players and several components can share one script.
- Events: `onReady`, `onStateChange`, `onPlaybackQualityChange`,
  `onPlaybackRateChange`, `onError`, `onApiChange` and `onAutoplayBlocked`
  (added 2023-11-20). State values: -1 unstarted, 0 ended, 1 playing,
  2 paused, 3 buffering, 5 cued.
- `setPlaybackQuality`, `getPlaybackQuality` and `getAvailableQualityLevels`
  are no-ops since 2019-10-24. Quality is chosen by YouTube. The old
  "lowest quality for the glow" trick does nothing and was removed. The
  follower player is instead kept small in layout terms only by the blur; the
  iframe still receives the same stream size as any embed of that size.
- `seekTo(seconds, allowSeekAhead)`: `allowSeekAhead=true` lets the player
  fetch unbuffered data. The follower always passes `true`.
- `setPlaybackRate(rate)` and `onPlaybackRateChange` allow rate mirroring.
- Autoplay: scripted playback of an unmuted player without a user gesture is
  blocked. The follower is always muted, which allows scripted `playVideo()`
  once the leader is playing after a user gesture. `onAutoplayBlocked` on the
  follower is surfaced as a coordinator event.
- Error 153 (2025-07-09): the embed needs a `Referer`. Next.js and Vercel
  send one by default. The `origin` player parameter is set to
  `window.location.origin` when available.
- `setSize` changes the iframe size in pixels. The package sizes the iframe
  through CSS (`width:100%; height:100%`) and never calls `setSize`.
- Communication is `postMessage` based. Every call is asynchronous and
  crosses a process boundary in Chromium (site isolation). Calling `seekTo`
  60 times per second, as the old code did, is the most expensive thing an
  embed can do. The coordinator issues at most one corrective seek per
  drift check window.
- `@types/youtube` exists on DefinitelyTyped but declares a global `YT`
  namespace with `any` in several places. `@videoglow/youtube` ships its own
  narrow typed interface for the subset it uses and never exposes the raw
  player to typed consumers except through `getRawPlayer()`.

## React and Next.js

- React 18 and 19 are supported. `useId`, `useSyncExternalStore` and
  `useInsertionEffect` are available; the compatibility shim from
  `react-ambilight` is gone.
- Strict Mode double-invokes effects. Every effect in the React packages
  creates its resources inside the effect and disposes them in the cleanup,
  so double mounting produces one live instance.
- Next.js App Router renders modules on the server unless a file starts with
  `'use client'`. All React package entry points carry that directive, and no
  module touches `window`, `document` or canvas at import time. Server
  components can import the packages; the effect only runs in the browser.
