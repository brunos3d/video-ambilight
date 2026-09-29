// Copies the static Storybook build into the examples app so it is served at /storybook on the same domain.
// Nx runs storybook:build-storybook before examples:build (see apps/examples/package.json).
import { cpSync, existsSync, readFileSync, rmSync, writeFileSync } from 'node:fs'
import { dirname, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'

const root = resolve(dirname(fileURLToPath(import.meta.url)), '../..')
const source = resolve(root, 'apps/storybook/storybook-static')
const target = resolve(root, 'apps/examples/public/storybook')

if (!existsSync(resolve(source, 'index.html'))) {
  console.error(
    `Storybook build not found at ${source}. Run: pnpm exec nx run storybook:build-storybook`
  )
  process.exit(1)
}
rmSync(target, { recursive: true, force: true })
cpSync(source, target, { recursive: true })

// Storybook emits relative asset URLs. A <base> lets both /storybook and /storybook/ resolve them.
for (const file of ['index.html', 'iframe.html']) {
  const path = resolve(target, file)
  const html = readFileSync(path, 'utf8')
  if (!html.includes('<base '))
    writeFileSync(path, html.replace('<head>', '<head><base href="/storybook/">'))
}
console.log(`Storybook copied to ${target}`)
