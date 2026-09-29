import { fileURLToPath } from 'node:url'
import { dirname, resolve } from 'node:path'
import { defineConfig, mergeConfig, type ViteUserConfig } from 'vitest/config'

const workspaceRoot = resolve(dirname(fileURLToPath(import.meta.url)), '../..')

const internalPackages = [
  'core',
  'video',
  'canvas',
  'youtube',
  'react',
  'react-video',
  'react-youtube',
] as const

/** Resolve internal packages from source so unit tests never depend on build output. */
export const workspaceAliases = Object.fromEntries(
  internalPackages.map((name) => [
    `@videoglow/${name}`,
    resolve(workspaceRoot, 'packages', name, 'src/index.ts'),
  ])
)

export function libraryTestConfig(overrides: ViteUserConfig = {}): ViteUserConfig {
  return mergeConfig(
    defineConfig({
      resolve: { alias: workspaceAliases },
      test: {
        environment: 'jsdom',
        // Testing Library registers automatic cleanup only when `afterEach` is global.
        globals: true,
        setupFiles: [resolve(workspaceRoot, 'tools/vitest/setup.ts')],
        include: ['src/**/*.test.{ts,tsx}'],
        coverage: {
          provider: 'v8',
          reporter: ['text', 'lcov'],
          include: ['src/**/*.{ts,tsx}'],
          exclude: ['src/**/*.test.{ts,tsx}', 'src/index.ts'],
        },
      },
    }),
    overrides
  )
}
