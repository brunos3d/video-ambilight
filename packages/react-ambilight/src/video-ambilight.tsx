import type { CSSProperties } from 'react'
import { YouTubeAmbilight } from '@videoglow/react-youtube'

export interface VideoAmbilightClassNames {
  readonly videoWrapper?: string
  readonly ambilightWrapper?: string
  readonly aspectRatio?: string
  readonly ambilight?: string
  readonly ambilightVideo?: string
}

/** Props of the 1.x component, kept unchanged. */
export interface VideoAmbilightProps {
  readonly videoId: string
  readonly className?: string
  readonly classNames?: VideoAmbilightClassNames
}

const VIDEO_WRAPPER: CSSProperties = {
  width: '100%',
  margin: '0 auto',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
}
const AMBILIGHT_WRAPPER: CSSProperties = { width: '100%', height: '100%', position: 'relative' }

function join(...names: Array<string | undefined>): string | undefined {
  const value = names.filter(Boolean).join(' ')
  return value || undefined
}

/**
 * The react-ambilight 1.x component, implemented on top of
 * `@videoglow/react-youtube`. New code should use `YouTubeAmbilight` directly.
 */
export function VideoAmbilight({ videoId, className, classNames = {} }: VideoAmbilightProps) {
  return (
    <div className={join(className, classNames.videoWrapper)} style={VIDEO_WRAPPER}>
      <div className={classNames.ambilightWrapper} style={AMBILIGHT_WRAPPER}>
        <YouTubeAmbilight
          videoId={videoId}
          className={classNames.aspectRatio}
          classNames={{ glow: classNames.ambilight, player: classNames.ambilightVideo }}
        />
      </div>
    </div>
  )
}
