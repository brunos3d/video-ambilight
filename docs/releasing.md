# Releasing

Releases use `nx release` with conventional commits. All `@videoglow/*`
packages and `react-ambilight` share one version (`projectsRelationship:
fixed` in `nx.json`), so a fix in core bumps every package and consumers
never mix versions.

## Prerequisites

- The `@videoglow` npm organization must exist and the publishing account
  must be a member. Creating the organization is a one-time action on
  npmjs.com.
- An `NPM_TOKEN` repository secret with publish rights (automation token).
- `react-ambilight` is published from the same workflow; the account must own
  it.

## Dry run

The `Release` workflow (Actions tab, `workflow_dispatch`) runs a dry run by
default: it builds and verifies the packages, then prints the versions and
changelogs that would be produced.

Locally:

```bash
pnpm exec nx run-many -t build --projects='packages/*'
node tools/scripts/verify-packages.mjs
pnpm exec nx release --dry-run
```

## Publishing

Run the `Release` workflow with `publish` checked. Optionally pass an explicit
bump (`patch`, `minor`, `major`, `prerelease`) or version. The workflow:

1. Builds the packages.
2. Verifies package contents (`tools/scripts/verify-packages.mjs`).
3. Bumps versions, writes changelogs, commits and tags.
4. Publishes to npm and creates a GitHub release.

## What gets published

Only `dist/`, `README.md`, `LICENSE` and `package.json` (see `files` in each
package). `workspace:^` dependency ranges are rewritten to real versions by
pnpm at pack time.
