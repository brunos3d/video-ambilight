import { render } from '@testing-library/react'
import { describe, expect, it } from 'vitest'
import VideoAmbilightDefault, { PlayerStates, VideoAmbilight } from './index'

describe('react-ambilight compatibility component', () => {
  it('keeps the 1.x markup hooks and default export', () => {
    expect(VideoAmbilightDefault).toBe(VideoAmbilight)
    const view = render(
      <VideoAmbilight
        videoId="abc"
        className="root"
        classNames={{
          videoWrapper: 'vw',
          ambilightWrapper: 'aw',
          aspectRatio: 'ar',
          ambilight: 'a',
          ambilightVideo: 'av',
        }}
      />
    )
    const root = view.container.firstElementChild as HTMLElement
    expect(root.className).toBe('root vw')
    expect(root.firstElementChild?.className).toBe('aw')
    const box = root.querySelector('[data-videoglow="youtube"]') as HTMLElement
    expect(box.className).toBe('ar')
    expect(box.querySelector('[data-videoglow="glow"]')?.className).toBe('a')
    expect(box.querySelector('[data-videoglow="player"]')?.className).toBe('av')
  })

  it('exposes the legacy PlayerStates values', () => {
    expect(PlayerStates).toEqual({
      BUFFERING: 3,
      ENDED: 0,
      PAUSED: 2,
      PLAYING: 1,
      UNSTARTED: -1,
      VIDEO_CUED: 5,
    })
  })
})
