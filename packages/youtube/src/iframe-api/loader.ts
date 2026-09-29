import type { YouTubeApiWindow, YouTubeIframeApi } from './types'

export const YOUTUBE_IFRAME_API_URL = 'https://www.youtube.com/iframe_api'

export interface LoadYouTubeIframeApiOptions {
  /** Window to load into. Defaults to the global window. */
  readonly window?: Window
  readonly scriptUrl?: string
  /** CSP nonce for the injected script tag. */
  readonly nonce?: string
  /** Reject when the API does not become ready in time. 0 disables the timeout (default). */
  readonly timeoutMs?: number
}

const pending = new WeakMap<Window, Promise<YouTubeIframeApi>>()

function apiOf(win: Window): YouTubeIframeApi | null {
  const yt = (win as unknown as YouTubeApiWindow).YT
  if (yt && typeof yt.Player === 'function' && yt.PlayerState) {
    return yt as YouTubeIframeApi
  }
  return null
}

/** True when `window.YT.Player` is usable. */
export function isYouTubeIframeApiLoaded(win: Window = window): boolean {
  return apiOf(win) !== null
}

/**
 * Loads the IFrame Player API once per window and resolves with the typed
 * `YT` namespace. Safe to call from many components: the script is injected a
 * single time and an existing `onYouTubeIframeAPIReady` callback is preserved.
 */
export function loadYouTubeIframeApi(
  options: LoadYouTubeIframeApiOptions = {}
): Promise<YouTubeIframeApi> {
  const win = options.window ?? window
  const loaded = apiOf(win)
  if (loaded) return Promise.resolve(loaded)

  const existing = pending.get(win)
  if (existing) return existing

  const promise = new Promise<YouTubeIframeApi>((resolve, reject) => {
    const target = win as unknown as YouTubeApiWindow
    const previous = target.onYouTubeIframeAPIReady
    let timer: ReturnType<typeof setTimeout> | null = null

    const finish = (): void => {
      if (timer !== null) clearTimeout(timer)
      const api = apiOf(win)
      if (api) {
        resolve(api)
      } else {
        pending.delete(win)
        reject(
          new Error(
            '@videoglow/youtube: onYouTubeIframeAPIReady fired but window.YT.Player is missing'
          )
        )
      }
    }

    target.onYouTubeIframeAPIReady = () => {
      previous?.()
      finish()
    }

    const doc = win.document
    const url = options.scriptUrl ?? YOUTUBE_IFRAME_API_URL
    const alreadyInjected = Array.from(doc.getElementsByTagName('script')).some(
      (script) => script.src === url
    )
    if (!alreadyInjected) {
      const script = doc.createElement('script')
      script.src = url
      script.async = true
      if (options.nonce) script.nonce = options.nonce
      script.addEventListener('error', () => {
        if (timer !== null) clearTimeout(timer)
        pending.delete(win)
        reject(new Error(`@videoglow/youtube: failed to load ${url}`))
      })
      ;(doc.head ?? doc.documentElement).appendChild(script)
    }

    if (options.timeoutMs && options.timeoutMs > 0) {
      timer = setTimeout(() => {
        pending.delete(win)
        reject(new Error('@videoglow/youtube: timed out waiting for the IFrame API'))
      }, options.timeoutMs)
    }
  })

  pending.set(win, promise)
  return promise
}
