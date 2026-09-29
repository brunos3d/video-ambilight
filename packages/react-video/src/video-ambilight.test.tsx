import { createRef, StrictMode } from 'react'
import { act, render } from '@testing-library/react'
import { describe, expect, it, vi } from 'vitest'
import type { Ambilight } from '@videoglow/core'
import { VideoAmbilight } from './video-ambilight'

describe('<VideoAmbilight>', () => {
  it('renders a video with forwarded attributes and ref, behind a glow canvas', () => {
    const ref = createRef<HTMLVideoElement>()
    const ambilightRef = createRef<Ambilight | null>()
    const onPlay = vi.fn()
    const view = render(
      <VideoAmbilight
        ref={ref}
        ambilightRef={ambilightRef}
        src="/clip.webm"
        muted
        loop
        controls
        onPlay={onPlay}
        className="wrap"
        videoClassName="vid"
        data-testid="video"
        blur={30}
      />
    )
    const video = view.getByTestId('video') as HTMLVideoElement
    expect(ref.current).toBe(video)
    expect(video.getAttribute('src')).toBe('/clip.webm')
    expect(video.loop).toBe(true)
    expect(video.hasAttribute('controls')).toBe(true)
    expect(video.className).toBe('vid')
    expect(video.style.display).toBe('block')
    const wrapper = video.parentElement as HTMLElement
    expect(wrapper.className).toBe('wrap')
    expect(wrapper.querySelector('canvas[data-videoglow="glow"]')).not.toBeNull()
    expect(ambilightRef.current?.getOptions().blur).toBe(30)
    expect(ambilightRef.current?.getState().sourceKind).toBe('video')
    video.dispatchEvent(new Event('play'))
    expect(onPlay).toHaveBeenCalled()
  })

  it('clears the ambilight ref on unmount and keeps one instance under Strict Mode', () => {
    const instances: Array<Ambilight | null> = []
    const view = render(
      <StrictMode>
        <VideoAmbilight
          src="/clip.webm"
          ambilightRef={(i) => {
            instances.push(i)
          }}
        />
      </StrictMode>
    )
    expect(document.querySelectorAll('canvas[data-videoglow="glow"]')).toHaveLength(1)
    const live = instances.filter((i): i is Ambilight => i !== null && i.getState().running)
    expect(live).toHaveLength(1)
    act(() => view.unmount())
    expect(instances.at(-1)).toBeNull()
    expect(document.querySelectorAll('canvas')).toHaveLength(0)
  })
})
