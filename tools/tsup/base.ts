import type { Options } from 'tsup'

export interface LibraryBuildOptions {
  /** Prepend the React Server Components client directive to every output file. */
  useClient?: boolean
  /** Modules that must never be bundled, in addition to package.json dependencies and peers. */
  external?: string[]
}

/**
 * Shared tsup configuration for every publishable package.
 * Produces ESM (`.js`), CommonJS (`.cjs`), declaration files and source maps.
 */
export function libraryConfig(options: LibraryBuildOptions = {}): Options {
  return {
    entry: ['src/index.ts'],
    format: ['esm', 'cjs'],
    target: 'es2020',
    platform: 'browser',
    dts: true,
    sourcemap: true,
    clean: true,
    // tsup's rollup treeshake pass drops `banner`, which would strip the client directive. esbuild already removes dead code.
    treeshake: false,
    splitting: false,
    minify: false,
    tsconfig: 'tsconfig.build.json',
    external: options.external ?? [],
    outExtension({ format }) {
      return { js: format === 'cjs' ? '.cjs' : '.js' }
    },
    banner: options.useClient ? { js: "'use client';" } : undefined,
    esbuildOptions(esbuild) {
      // Keep the client directive if a source file already declares it; the banner adds it otherwise.
      esbuild.legalComments = 'none'
    },
  }
}
