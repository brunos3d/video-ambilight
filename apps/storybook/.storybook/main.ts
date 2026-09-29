import type { StorybookConfig } from '@storybook/react-vite'

const config: StorybookConfig = {
  stories: ['../stories/**/*.mdx', '../stories/**/*.stories.@(ts|tsx)'],
  addons: ['@storybook/addon-docs'],
  framework: {
    name: '@storybook/react-vite',
    options: {},
  },
  // Media fixtures are shared with the examples app.
  staticDirs: ['../../examples/public'],
  core: {
    disableTelemetry: true,
  },
}

export default config
