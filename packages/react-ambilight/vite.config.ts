/// <reference types="vite/client" />
import MagicString from 'magic-string'
import path, { resolve } from 'node:path'
import { fileURLToPath } from 'node:url'
import { globSync } from 'glob'
import { defineConfig, Plugin } from 'vite'
import react from '@vitejs/plugin-react'
import dts from 'vite-plugin-dts'
import preserveDirectives from 'rollup-preserve-directives'

/**
 * libInjectCss places it at the top of the file, this is a
 * somewhat hacky way to make sure any potential `use client`
 * directives are hoisted to the top of the file.
 */
function hoistUseClient(): Plugin {
  let resolvedConfig: any

  return {
    // TODO: keep an eye on this discussion https://github.com/huozhi/rollup-preserve-directives/issues/27
    name: 'nordcom:use-client',
    apply: 'build',
    enforce: 'post',
    configResolved(config) {
      resolvedConfig = config
    },
    generateBundle(_, bundle) {
      for (const chunk of Object.values(bundle)) {
        if (
          chunk.type !== 'chunk' ||
          !chunk.viteMetadata?.importedCss.size ||
          !chunk.code.includes('use client')
        ) {
          continue
        }

        const ms = new MagicString(chunk.code)

        ms.replaceAll(/['"]use client['"];?\n?/g, '')
        ms.prepend(`'use client';\n`)

        chunk.code = ms.toString()
        if (resolvedConfig.build.sourcemap) {
          chunk.map = ms.generateMap({ hires: 'boundary' })
        }
      }
    },
  }
}

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [
    react(),
    dts({ exclude: ['**/*.stories.ts', 'src/test', '**/*.test.tsx'] }),
    hoistUseClient(), // hoist "use client" directives to the top of the file
  ],
  build: {
    lib: {
      entry: resolve(__dirname, 'src/main.ts'),
      formats: ['es'],
    },
    rollupOptions: {
      plugins: [
        preserveDirectives(), // will preserve "use client" in the client components
      ],
      external: ['react', 'react-dom', 'react/jsx-runtime'],
      // https://rollupjs.org/configuration-options/#input
      input: Object.fromEntries(
        globSync(['src/components/**/index.tsx', 'src/main.ts']).map((file) => {
          // This remove `src/` as well as the file extension from each
          // file, so e.g. src/nested/foo.js becomes nested/foo
          const entryName = path.relative(
            'src',
            file.slice(0, file.length - path.extname(file).length)
          )
          // This expands the relative paths to absolute paths, so e.g.
          // src/nested/foo becomes /project/src/nested/foo.js
          const entryUrl = fileURLToPath(new URL(file, import.meta.url))
          return [entryName, entryUrl]
        })
      ),
      output: {
        entryFileNames: '[name].js',
        assetFileNames: 'assets/[name][extname]',
        globals: {
          react: 'React',
          'react-dom': 'React-dom',
          'react/jsx-runtime': 'react/jsx-runtime',
        },
      },
    },
  },
})
