# npm scope and package naming

## Constraints

- Several packages share one scope.
- The scope must not be a personal identity.
- The scope must be short, memorable and related to the project.
- The existing `react-ambilight` package must remain installable and become a
  compatibility layer.

## Candidates checked (September 2026)

The npm website blocks anonymous org lookups, so availability was checked
through the registry search index (`scope:<name>` queries), through the
unscoped package name and through a web search for existing products.

| Scope        | Packages in scope | Unscoped name                     | Notes                                                                        |
| ------------ | ----------------- | --------------------------------- | ---------------------------------------------------------------------------- |
| `@ambilight` | 0                 | taken (Philips TV client)         | "Ambilight" is a registered Philips trademark. Too risky as an org identity. |
| `@ambiglow`  | 0                 | free                              | "Ambiglow" is the Philips Evnia monitor lighting feature. Same problem.      |
| `@ambi`      | 0                 | taken (unrelated promise utility) | Ambiguous.                                                                   |
| `@ambilite`  | 0                 | free                              | Reads like a typo of the trademark.                                          |
| `@glowlight` | 0                 | free                              | Generic, collides with lighting hardware vocabulary.                         |
| `@videoglow` | 0                 | free                              | Descriptive, no trademark, no existing product.                              |

`video-ambient-glow` (unrelated project, 2025) exists on npm but is a different
name and is not scoped.

## Decision

Scope: **`@videoglow`**

| Package                    | Responsibility                                                                                                   |
| -------------------------- | ---------------------------------------------------------------------------------------------------------------- |
| `@videoglow/core`          | Framework-agnostic engine: frame sources, frame clock, canvas glow renderer, glow style, lifecycle.              |
| `@videoglow/video`         | `HTMLVideoElement` frame source with `requestVideoFrameCallback` and media event handling.                       |
| `@videoglow/canvas`        | `HTMLCanvasElement`, `OffscreenCanvas` and `ImageBitmap` frame sources.                                          |
| `@videoglow/youtube`       | YouTube IFrame API loader, typed player controller, leader/follower playback coordinator, DOM mount.             |
| `@videoglow/react`         | React bindings for the core: `Ambilight` component, `useAmbilight`, `useFrameSource`.                            |
| `@videoglow/react-video`   | `VideoAmbilight` component and `useVideoSource` for native video.                                                |
| `@videoglow/react-youtube` | `YouTubeAmbilight` component and `useYouTubeAmbilight`.                                                          |
| `react-ambilight`          | Compatibility package. Re-exports `VideoAmbilight` with the 1.x prop shape on top of `@videoglow/react-youtube`. |

The scope has to be created on npmjs.com by the repository owner before the
first publish (`npm org` creation is a website action). Nothing in the build
depends on the scope existing until `nx release publish` runs.

## Naming rules inside the scope

- Package names describe a media source or a framework, never an
  implementation detail (`canvas` is a source, not "the renderer").
- Framework bindings are prefixed with the framework name (`react-video`).
- Entry points are the package root only. No deep imports are supported.
