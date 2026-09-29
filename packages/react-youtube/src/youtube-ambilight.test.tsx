import { createRef, StrictMode } from 'react'
import { act, render } from '@testing-library/react'
import { describe, expect, it, vi } from 'vitest'
import { YouTubePlayerState } from '@videoglow/youtube'
import type {
  YouTubeIframeApi,
  YouTubePlayerInstance,
  YouTubePlayerOptions,
} from '@videoglow/youtube'
import { YouTubeAmbilight, type YouTubeAmbilightHandle } from './youtube-ambilight'

interface FakePlayer extends YouTubePlayerInstance {
  options: YouTubePlayerOptions
  destroyed: boolean
  calls: string[]
  emitReady(): void
  emitState(state: YouTubePlayerState): void
}

function createFakeApi(): { api: YouTubeIframeApi; players: FakePlayer[] } {
  const players: FakePlayer[] = []
  class Player implements FakePlayer {
    options: YouTubePlayerOptions
    destroyed = false
    calls: string[] = []
    private iframe = document.createElement('iframe')
    private state: YouTubePlayerState = YouTubePlayerState.UNSTARTED
    constructor(element: HTMLElement | string, options: YouTubePlayerOptions) {
      this.options = options
      ;(element as HTMLElement).replaceWith(this.iframe)
      players.push(this)
    }
    emitReady() {
      this.options.events?.onReady?.({ target: this, data: undefined })
    }
    emitState(state: YouTubePlayerState) {
      this.state = state
      this.options.events?.onStateChange?.({ target: this, data: state })
    }
    playVideo() {
      this.calls.push('playVideo')
    }
    pauseVideo() {
      this.calls.push('pauseVideo')
    }
    stopVideo() {}
    seekTo() {}
    mute() {}
    unMute() {}
    isMuted() {
      return true
    }
    setVolume() {}
    getVolume() {
      return 0
    }
    setPlaybackRate() {}
    getPlaybackRate() {
      return 1
    }
    getAvailablePlaybackRates() {
      return [1]
    }
    getPlayerState() {
      return this.state
    }
    getCurrentTime() {
      return 0
    }
    getDuration() {
      return 0
    }
    getVideoLoadedFraction() {
      return 0
    }
    getVideoUrl() {
      return ''
    }
    loadVideoById(id: string) {
      this.calls.push(`load:${id}`)
    }
    cueVideoById(id: string) {
      this.calls.push(`cue:${id}`)
    }
    getIframe() {
      return this.iframe
    }
    destroy() {
      this.destroyed = true
      this.iframe.remove()
    }
    addEventListener() {}
    removeEventListener() {}
  }
  return { api: { Player, PlayerState: YouTubePlayerState }, players }
}

const flush = async () => {
  for (let i = 0; i < 20; i += 1) await Promise.resolve()
}

describe('<YouTubeAmbilight>', () => {
  it('mounts two players, reports readiness and forwards leader events', async () => {
    const fake = createFakeApi()
    const loadApi = () => Promise.resolve(fake.api)
    const ref = createRef<YouTubeAmbilightHandle>()
    const onReady = vi.fn()
    const onLeaderEvent = vi.fn()
    const view = render(
      <YouTubeAmbilight
        ref={ref}
        videoId="abc"
        loadApi={loadApi}
        onReady={onReady}
        onLeaderEvent={onLeaderEvent}
        glow={{ blur: 33 }}
        data-testid="yt"
      />
    )
    await act(flush)
    expect(fake.players).toHaveLength(2)
    const wrapper = view.getByTestId('yt')
    expect(wrapper.querySelectorAll('iframe')).toHaveLength(2)
    expect((wrapper.firstElementChild as HTMLElement).style.filter).toContain('blur(33px)')
    await act(async () => {
      fake.players.forEach((p) => p.emitReady())
      await flush()
    })
    expect(onReady).toHaveBeenCalledTimes(1)
    expect(ref.current?.getLeader()?.isReady()).toBe(true)
    expect(ref.current?.getCoordinator()?.getSnapshot().running).toBe(true)
    act(() => fake.players[0]?.emitState(YouTubePlayerState.PLAYING))
    expect(onLeaderEvent).toHaveBeenCalledWith({
      type: 'statechange',
      state: YouTubePlayerState.PLAYING,
    })
    expect(fake.players[1]?.calls).toContain('playVideo')
  })

  it('loads a new video on videoId change and destroys players on unmount', async () => {
    const fake = createFakeApi()
    const loadApi = () => Promise.resolve(fake.api)
    const view = render(<YouTubeAmbilight videoId="one" loadApi={loadApi} />)
    await act(flush)
    await act(async () => {
      fake.players.forEach((p) => p.emitReady())
      await flush()
    })
    act(() => {
      view.rerender(<YouTubeAmbilight videoId="two" loadApi={loadApi} />)
    })
    expect(fake.players).toHaveLength(2)
    expect(fake.players[0]?.calls).toContain('load:two')
    expect(fake.players[1]?.calls).toContain('cue:two')
    view.unmount()
    expect(fake.players.every((p) => p.destroyed)).toBe(true)
  })

  it('keeps exactly two live players under Strict Mode', async () => {
    const fake = createFakeApi()
    const loadApi = () => Promise.resolve(fake.api)
    render(
      <StrictMode>
        <YouTubeAmbilight videoId="abc" loadApi={loadApi} />
      </StrictMode>
    )
    await act(flush)
    expect(fake.players.filter((p) => !p.destroyed)).toHaveLength(2)
    expect(document.querySelectorAll('iframe')).toHaveLength(2)
  })
})
