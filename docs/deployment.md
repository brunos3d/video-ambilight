# Deploying the examples app to Vercel

The examples site is `apps/examples`, a Next.js 16 App Router application,
served at https://videoglow.brunosilva.io. It consumes the built packages, so
the build must run through Nx to build the packages first.

## Project settings

1. Import the repository in Vercel.
2. Set **Root Directory** to `apps/examples`.
3. Keep **Include source files outside of the Root Directory** enabled (the
   default for monorepos). Vercel detects the pnpm workspace and runs the
   install at the repository root.
4. Framework preset: Next.js (auto-detected).
5. Domain: `videoglow.brunosilva.io` is assigned to the production
   environment. Preview deployments keep the default `*.vercel.app` URLs.

`apps/examples/vercel.json` sets the commands:

```json
{
  "installCommand": "pnpm install --frozen-lockfile",
  "buildCommand": "pnpm exec nx build examples"
}
```

`nx build examples` builds the eight packages, builds Storybook, copies it
into `apps/examples/public/storybook` and then runs `next build`, so the site
serves Storybook at `/storybook`.
Nx caching is local only; add Nx Cloud if build times matter.

## Environment

No environment variables are required. The YouTube page loads
`https://www.youtube.com/iframe_api` at runtime.

## Local production check

```bash
pnpm exec nx build examples
pnpm --filter examples start
```
