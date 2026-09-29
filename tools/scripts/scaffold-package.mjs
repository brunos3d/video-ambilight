// Usage: node tools/scripts/scaffold-package.mjs <dir> <npm-name> <tag> [useClient]
// Writes the boilerplate every publishable package shares. Source files are written by hand.
import { mkdirSync, writeFileSync, existsSync } from 'node:fs'
import { join } from 'node:path'

const [dir, name, tag, useClient] = process.argv.slice(2)
if (!dir || !name || !tag) throw new Error('usage: scaffold-package <dir> <name> <tag> [useClient]')
const root = join('packages', dir)
mkdirSync(join(root, 'src'), { recursive: true })

const write = (file, content) => {
  const path = join(root, file)
  if (!existsSync(path)) writeFileSync(path, content)
}

write(
  'tsconfig.json',
  `{
  "extends": "../../tsconfig.base.json",
  "compilerOptions": {
    "noEmit": true,
    "types": ["node"]
  },
  "include": ["src/**/*.ts", "src/**/*.tsx", "vitest.config.ts", "tsup.config.ts"]
}
`
)
write(
  'tsconfig.build.json',
  `{
  "extends": "../../tsconfig.base.json",
  "compilerOptions": {
    "rootDir": "src",
    "outDir": "dist",
    "paths": {}
  },
  "include": ["src/**/*.ts", "src/**/*.tsx"],
  "exclude": ["src/**/*.test.ts", "src/**/*.test.tsx", "src/**/test-utils/**"]
}
`
)
write(
  'tsup.config.ts',
  `import { defineConfig } from 'tsup'
import { libraryConfig } from '../../tools/tsup/base'

export default defineConfig(libraryConfig(${useClient ? '{ useClient: true }' : ''}))
`
)
write(
  'vitest.config.ts',
  `import { libraryTestConfig } from '../../tools/vitest/base.mjs'

export default libraryTestConfig()
`
)
console.log('scaffolded', root, name, tag)
