// @ts-check
import nx from '@nx/eslint-plugin'
import tseslint from 'typescript-eslint'
import reactHooks from 'eslint-plugin-react-hooks'
import prettier from 'eslint-config-prettier'

export default tseslint.config(
  {
    ignores: [
      '**/dist/**',
      '**/.next/**',
      '**/storybook-static/**',
      '**/coverage/**',
      '**/node_modules/**',
      '**/playwright-report/**',
      '**/test-results/**',
      '**/next-env.d.ts',
      '**/public/storybook/**',
      '.nx/**',
    ],
  },
  ...nx.configs['flat/base'],
  ...nx.configs['flat/typescript'],
  ...tseslint.configs.recommended,
  {
    files: ['**/*.ts', '**/*.tsx', '**/*.js', '**/*.jsx', '**/*.mjs', '**/*.cjs'],
    rules: {
      '@nx/enforce-module-boundaries': [
        'error',
        {
          enforceBuildableLibDependency: true,
          allow: [],
          depConstraints: [
            { sourceTag: 'layer:core', onlyDependOnLibsWithTags: [] },
            { sourceTag: 'layer:source', onlyDependOnLibsWithTags: ['layer:core'] },
            { sourceTag: 'layer:react', onlyDependOnLibsWithTags: ['layer:core'] },
            {
              sourceTag: 'layer:react-source',
              onlyDependOnLibsWithTags: ['layer:core', 'layer:source', 'layer:react'],
            },
            {
              sourceTag: 'layer:compat',
              onlyDependOnLibsWithTags: [
                'layer:core',
                'layer:source',
                'layer:react',
                'layer:react-source',
              ],
            },
            { sourceTag: 'layer:app', onlyDependOnLibsWithTags: ['*'] },
          ],
        },
      ],
      '@typescript-eslint/no-explicit-any': 'error',
      '@typescript-eslint/consistent-type-imports': ['error', { prefer: 'type-imports' }],
      '@typescript-eslint/no-unused-vars': [
        'error',
        { argsIgnorePattern: '^_', varsIgnorePattern: '^_' },
      ],
      // No-op callbacks are a deliberate pattern in the lifecycle code.
      '@typescript-eslint/no-empty-function': 'off',
    },
  },
  {
    // Tooling config files import the shared factories in tools/ by relative path.
    files: [
      '**/tsup.config.ts',
      '**/vitest.config.ts',
      '**/vite.config.ts',
      '**/playwright.config.ts',
      '**/next.config.*',
      '**/.storybook/**',
      'tools/**',
    ],
    rules: {
      '@nx/enforce-module-boundaries': 'off',
    },
  },
  {
    files: ['**/*.ts', '**/*.tsx'],
    plugins: { 'react-hooks': reactHooks },
    rules: {
      ...reactHooks.configs.recommended.rules,
    },
  },
  prettier
)
