import type { Preview } from '@storybook/react-vite'

const preview: Preview = {
  parameters: {
    layout: 'fullscreen',
    backgrounds: {
      options: {
        dark: { name: 'dark', value: '#0b0b0f' },
        light: { name: 'light', value: '#f4f4f8' },
      },
    },
    controls: { expanded: true },
  },
  initialGlobals: {
    backgrounds: { value: 'dark' },
  },
}

export default preview
