import { addons } from 'storybook/manager-api'
import { create } from 'storybook/theming'

addons.setConfig({
  theme: create({
    base: 'dark',
    brandTitle: 'videoglow',
    brandUrl: 'https://github.com/brunos3d/video-ambilight',
    brandImage: '/videoglow-logo.svg',
    brandTarget: '_blank',
  }),
})
