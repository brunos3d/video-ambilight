// Verifies every publishable package the way a consumer would see it:
// - package.json exports point at files that exist
// - the CJS entry loads under Node and the ESM entry imports
// - declarations exist and internal packages are external (not inlined)
// - `npm pack --dry-run` includes only dist, README and LICENSE
import { execFileSync } from 'node:child_process'
import { existsSync, readFileSync, readdirSync } from 'node:fs'
import { createRequire } from 'node:module'
import { join, resolve } from 'node:path'
import { pathToFileURL } from 'node:url'

const root = resolve(new URL('../..', import.meta.url).pathname)
const packagesDir = join(root, 'packages')
const require = createRequire(import.meta.url)
const failures = []

// A DOM-free Node process cannot evaluate React components that touch the DOM,
// but package modules must not touch browser globals at import time.
for (const dir of readdirSync(packagesDir)) {
  const pkgDir = join(packagesDir, dir)
  const pkgPath = join(pkgDir, 'package.json')
  if (!existsSync(pkgPath)) continue
  const pkg = JSON.parse(readFileSync(pkgPath, 'utf8'))
  const name = pkg.name

  const entry = pkg.exports?.['.']
  for (const [condition, file] of Object.entries(entry ?? {})) {
    if (!existsSync(join(pkgDir, file)))
      failures.push(`${name}: exports["."].${condition} -> ${file} is missing`)
  }
  for (const key of ['main', 'module', 'types']) {
    if (pkg[key] && !existsSync(join(pkgDir, pkg[key])))
      failures.push(`${name}: ${key} -> ${pkg[key]} is missing`)
  }

  try {
    require(join(pkgDir, entry.require))
  } catch (error) {
    failures.push(`${name}: require(${entry.require}) failed: ${error.message}`)
  }
  try {
    await import(pathToFileURL(join(pkgDir, entry.import)).href)
  } catch (error) {
    failures.push(`${name}: import(${entry.import}) failed: ${error.message}`)
  }

  const dts = readFileSync(join(pkgDir, entry.types), 'utf8')
  // Every internal package the declarations import must be a declared dependency.
  const declared = new Set([
    ...Object.keys(pkg.dependencies ?? {}),
    ...Object.keys(pkg.peerDependencies ?? {}),
  ])
  for (const match of dts.matchAll(/from '(@videoglow\/[a-z-]+)'/g)) {
    if (!declared.has(match[1]))
      failures.push(`${name}: declarations import undeclared dependency ${match[1]}`)
  }
  // Core types must be referenced, never copied, by dependents.
  if (name !== '@videoglow/core' && /\binterface (FrameSource|GlowStyle|Ambilight)\b/.test(dts)) {
    failures.push(`${name}: declarations inline core types instead of importing them`)
  }
  if (/\bany\b/.test(dts.replace(/\/\*[\s\S]*?\*\//g, '').replace(/\/\/.*$/gm, ''))) {
    failures.push(`${name}: declarations contain 'any'`)
  }

  const packed = JSON.parse(
    execFileSync('npm', ['pack', '--dry-run', '--json', '--ignore-scripts'], {
      cwd: pkgDir,
      encoding: 'utf8',
      stdio: ['ignore', 'pipe', 'ignore'],
    })
  )
  const files = packed[0].files.map((f) => f.path)
  const unexpected = files.filter(
    (f) => !(f.startsWith('dist/') || ['package.json', 'README.md', 'LICENSE'].includes(f))
  )
  if (unexpected.length)
    failures.push(`${name}: unexpected files in tarball: ${unexpected.join(', ')}`)
  if (!files.includes('README.md')) failures.push(`${name}: README.md missing from tarball`)
  if (!files.includes('LICENSE')) failures.push(`${name}: LICENSE missing from tarball`)
  console.log(
    `${name}: ok (${files.length} files, ${(packed[0].unpackedSize / 1024).toFixed(1)} KB unpacked)`
  )
}

if (failures.length) {
  console.error('\nPackage verification failed:\n- ' + failures.join('\n- '))
  process.exit(1)
}
console.log('\nAll packages verified.')
