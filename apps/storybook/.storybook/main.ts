import type { StorybookConfig } from '@storybook/react-vite'

const config: StorybookConfig = {
  stories: ['../stories/**/*.mdx', '../stories/**/*.stories.@(ts|tsx)'],
  addons: ['@storybook/addon-docs'],
  framework: {
    name: '@storybook/react-vite',
    options: {},
  },
  // Media fixtures and the logo are shared with the examples app. Listed explicitly so the
  // Storybook build never picks up its own copy under apps/examples/public/storybook.
  staticDirs: [
    { from: '../../examples/public/media', to: '/media' },
    { from: '../../examples/public/videoglow-logo.svg', to: '/videoglow-logo.svg' },
  ],
  core: {
    disableTelemetry: true,
  },
}

export default config
