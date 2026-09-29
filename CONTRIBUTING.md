# Contributing

## Setup

Node 20.9 or later and pnpm 10.

```bash
pnpm install
pnpm build
pnpm test
```

## Layout

```
apps/examples        Next.js 16 App Router site (videoglow.brunosilva.io, e2e target)
apps/examples-e2e    Playwright tests
apps/storybook       Storybook host; stories live in apps/storybook/stories; its static build ships inside the site at /storybook
packages/*           publishable packages
tools/tsup           shared build config
tools/vitest         shared test config and jsdom setup
tools/scripts        fixtures generator, package scaffold, package verifier
docs/                architecture, deployment, releasing
```

## Working on a package

```bash
pnpm exec nx test @videoglow/core --watch
pnpm exec nx build @videoglow/core
pnpm exec nx lint @videoglow/core
pnpm exec nx typecheck @videoglow/core
```

Unit tests resolve internal packages from source through `tsconfig.base.json`
paths, so no build is needed while iterating. The apps consume the built
`dist` output; Nx builds dependencies first (`dependsOn: ^build`).

Package boundaries are enforced by ESLint through the `layer:*` tags in each
`package.json`. A source package cannot import a React package; run
`pnpm lint` to check.

## Browser tests

```bash
pnpm --filter examples-e2e exec playwright install chromium
pnpm e2e
```

The suite starts the built examples app on port 3100. The YouTube test needs
network access and skips itself when the IFrame API does not load.

## Media fixtures

Test clips are generated with ffmpeg:

```bash
pnpm fixtures:media
```

## Open Graph image

The social preview is a static file, `apps/examples/public/og-image.png`.
Regenerate it after changing the copy in `apps/examples/lib/seo.ts`:

```bash
pnpm --filter examples og:generate
```

## Commits

Conventional Commits (`feat(core): ...`, `fix(youtube): ...`). Releases derive
versions and changelogs from these messages.
