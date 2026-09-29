# Releasing

Releases use `nx release` with conventional commits. All `@videoglow/*`
packages and `react-ambilight` share one version (`projectsRelationship:
fixed` in `nx.json`), so a fix in core bumps every package and consumers
never mix versions.

## Prerequisites

- The `@videoglow` npm organization must exist and the publishing account
  must be a member. Creating the organization is a one-time action on
  npmjs.com.
- `react-ambilight` is published from the same workflow; the account must own
  it.

Releases run from a maintainer's machine; there is no release workflow in
GitHub Actions.

## Dry run

```bash
pnpm exec nx run-many -t build --projects='packages/*'
node tools/scripts/verify-packages.mjs
pnpm exec nx release --dry-run            # add --first-release before the first tag exists
```

## Publishing

```bash
npm login                                  # member of the @videoglow organization
pnpm exec nx release --first-release       # omit --first-release after the first tag
git push --follow-tags
```

`nx release` builds the packages (pre-version command), bumps versions from
conventional commits, writes changelogs, commits, tags and publishes. Pass an
explicit bump (`patch`, `minor`, `major`, `prerelease`) or version when the
commit history should not decide it.

## What gets published

Only `dist/`, `README.md`, `LICENSE` and `package.json` (see `files` in each
package). `workspace:^` dependency ranges are rewritten to real versions by
pnpm at pack time.
