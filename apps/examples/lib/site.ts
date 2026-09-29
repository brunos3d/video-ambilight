import type { ComponentType } from 'react'
import {
  Activity,
  BookOpen,
  Clapperboard,
  Cpu,
  GitCompare,
  History,
  PaintBucket,
  SlidersHorizontal,
} from 'lucide-react'
import { YouTubeIcon } from '@/components/brand-icons'

/** Lucide icons and the Simple Icons brand marks share this surface. */
export type IconComponent = ComponentType<{
  size?: number
  className?: string
  strokeWidth?: number
}>

export const SITE = {
  name: 'videoglow',
  url: 'https://videoglow.brunosilva.io',
  description:
    'Ambilight style glow for video, canvas and YouTube. Framework-agnostic core with React integrations.',
  repo: 'https://github.com/brunos3d/video-ambilight',
  npm: 'https://www.npmjs.com/org/videoglow',
  npmCore: 'https://www.npmjs.com/package/@videoglow/core',
  /** Static Storybook build, served by this site. */
  storybook: '/storybook',
  author: {
    name: 'Bruno Silva',
    site: 'https://brunosilva.io',
    github: 'https://github.com/brunos3d',
  },
} as const

export type DemoHref =
  | '/native-video'
  | '/canvas'
  | '/youtube'
  | '/react'
  | '/core'
  | '/configuration'
  | '/performance'
  | '/baseline'
  | '/legacy'

export interface DemoRoute {
  readonly href: DemoHref
  readonly title: string
  readonly summary: string
  readonly packages: readonly string[]
  readonly icon: IconComponent
}

export interface DemoGroup {
  readonly label: string
  readonly routes: readonly DemoRoute[]
}

export const DEMO_GROUPS: readonly DemoGroup[] = [
  {
    label: 'Sources',
    routes: [
      {
        href: '/native-video',
        title: 'Native video',
        summary: 'A <video> element with the glow behind it, driven by requestVideoFrameCallback.',
        packages: ['@videoglow/react-video'],
        icon: Clapperboard,
      },
      {
        href: '/canvas',
        title: 'Canvas source',
        summary: 'Any canvas you draw into becomes a frame source, continuous or on demand.',
        packages: ['@videoglow/react', '@videoglow/canvas'],
        icon: PaintBucket,
      },
      {
        href: '/youtube',
        title: 'YouTube',
        summary: 'Two synchronized IFrame players with an observable drift policy.',
        packages: ['@videoglow/react-youtube', '@videoglow/youtube'],
        icon: YouTubeIcon,
      },
    ],
  },
  {
    label: 'Integration',
    routes: [
      {
        href: '/react',
        title: 'React hooks',
        summary: 'Compose useFrameSource and useAmbilight when you own the markup.',
        packages: ['@videoglow/react'],
        icon: BookOpen,
      },
      {
        href: '/core',
        title: 'Core without React',
        summary: 'The engine driven from plain DOM code.',
        packages: ['@videoglow/core', '@videoglow/video'],
        icon: Cpu,
      },
      {
        href: '/configuration',
        title: 'Configuration',
        summary: 'Live controls for blur, opacity, saturation, scale, fps and buffer resolution.',
        packages: ['@videoglow/react-video'],
        icon: SlidersHorizontal,
      },
    ],
  },
  {
    label: 'Validation',
    routes: [
      {
        href: '/performance',
        title: 'Performance',
        summary: 'Measure render cost per frame across buffer resolutions and sampling rates.',
        packages: ['@videoglow/core'],
        icon: Activity,
      },
      {
        href: '/baseline',
        title: 'Baseline comparison',
        summary:
          'The original full-resolution pipeline compared with the new small-buffer pipeline.',
        packages: ['@videoglow/react-video'],
        icon: GitCompare,
      },
      {
        href: '/legacy',
        title: 'react-ambilight 1.x API',
        summary: 'The compatibility package running on the new implementation.',
        packages: ['react-ambilight'],
        icon: History,
      },
    ],
  },
]

export const DEMOS: readonly DemoRoute[] = DEMO_GROUPS.flatMap((group) => group.routes)
