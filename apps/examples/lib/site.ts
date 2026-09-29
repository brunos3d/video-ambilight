export interface DemoRoute {
  readonly href:
    | '/native-video'
    | '/canvas'
    | '/youtube'
    | '/react'
    | '/core'
    | '/configuration'
    | '/performance'
    | '/baseline'
    | '/legacy'
  readonly title: string
  readonly summary: string
  readonly packages: readonly string[]
}

export const DEMOS: readonly DemoRoute[] = [
  {
    href: '/native-video',
    title: 'Native video',
    summary: 'A <video> element with the glow behind it, driven by requestVideoFrameCallback.',
    packages: ['@videoglow/react-video'],
  },
  {
    href: '/canvas',
    title: 'Canvas source',
    summary: 'Any canvas you draw into becomes a frame source, continuous or on demand.',
    packages: ['@videoglow/react', '@videoglow/canvas'],
  },
  {
    href: '/youtube',
    title: 'YouTube',
    summary: 'Two synchronized IFrame players with an observable drift policy.',
    packages: ['@videoglow/react-youtube', '@videoglow/youtube'],
  },
  {
    href: '/react',
    title: 'React hooks',
    summary: 'Compose useFrameSource and useAmbilight when you own the markup.',
    packages: ['@videoglow/react'],
  },
  {
    href: '/core',
    title: 'Core without React',
    summary: 'The engine driven from plain DOM code.',
    packages: ['@videoglow/core', '@videoglow/video'],
  },
  {
    href: '/configuration',
    title: 'Configuration',
    summary: 'Live controls for blur, opacity, saturation, scale, fps and buffer resolution.',
    packages: ['@videoglow/react-video'],
  },
  {
    href: '/performance',
    title: 'Performance',
    summary: 'Measure render cost per frame across buffer resolutions and sampling rates.',
    packages: ['@videoglow/core'],
  },
  {
    href: '/baseline',
    title: 'Baseline comparison',
    summary: 'The original full-resolution pipeline compared with the new small-buffer pipeline.',
    packages: ['@videoglow/react-video'],
  },
  {
    href: '/legacy',
    title: 'react-ambilight 1.x API',
    summary: 'The compatibility package running on the new implementation.',
    packages: ['react-ambilight'],
  },
]
