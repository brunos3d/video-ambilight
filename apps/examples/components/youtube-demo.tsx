'use client'

import { useCallback, useEffect, useState } from 'react'
import type {
  CoordinatorEvent,
  CoordinatorSnapshot,
  YouTubeAmbilight as YouTubeAmbilightInstance,
} from '@videoglow/youtube'
import { YouTubeAmbilight } from '@videoglow/react-youtube'
import { YOUTUBE_VIDEO_ID } from '@/lib/media'

const STATE_NAMES: Record<number, string> = {
  [-1]: 'unstarted',
  0: 'ended',
  1: 'playing',
  2: 'paused',
  3: 'buffering',
  5: 'cued',
}

export function YouTubeDemo() {
  const [videoId, setVideoId] = useState(YOUTUBE_VIDEO_ID)
  const [draft, setDraft] = useState(YOUTUBE_VIDEO_ID)
  const [instance, setInstance] = useState<YouTubeAmbilightInstance | null>(null)
  const [snapshot, setSnapshot] = useState<CoordinatorSnapshot | null>(null)
  const [log, setLog] = useState<string[]>([])

  const onCoordinatorEvent = useCallback((event: CoordinatorEvent) => {
    setLog((entries) =>
      [`${new Date().toLocaleTimeString()} ${JSON.stringify(event)}`, ...entries].slice(0, 12)
    )
  }, [])

  useEffect(() => {
    if (!instance) return
    const id = setInterval(() => setSnapshot(instance.coordinator.getSnapshot()), 250)
    return () => clearInterval(id)
  }, [instance])

  return (
    <>
      <div className="stage">
        <YouTubeAmbilight
          videoId={videoId}
          onReady={setInstance}
          onCoordinatorEvent={onCoordinatorEvent}
          glow={{ blur: 80, opacity: 0.5, saturation: 3, scale: 1.2 }}
          data-testid="youtube-demo"
        />
      </div>
      <form
        className="button-row"
        onSubmit={(event) => {
          event.preventDefault()
          setVideoId(draft.trim())
        }}
      >
        <input
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
          aria-label="YouTube video id"
          style={{ padding: '0.4rem 0.6rem', font: 'inherit' }}
        />
        <button type="submit">Load video</button>
        <button type="button" onClick={() => instance?.coordinator.sync()}>
          Force sync
        </button>
      </form>
      <section className="panel" aria-label="Coordinator snapshot">
        <h2>Coordinator snapshot</h2>
        <dl className="stats">
          <div>
            <dt>ready</dt>
            <dd data-testid="yt-ready">{String(snapshot?.ready ?? false)}</dd>
          </div>
          <div>
            <dt>leader</dt>
            <dd data-testid="yt-leader">{snapshot ? STATE_NAMES[snapshot.leaderState] : '-'}</dd>
          </div>
          <div>
            <dt>follower</dt>
            <dd data-testid="yt-follower">
              {snapshot ? STATE_NAMES[snapshot.followerState] : '-'}
            </dd>
          </div>
          <div>
            <dt>leader time</dt>
            <dd>{snapshot ? snapshot.leaderTime.toFixed(2) : '-'} s</dd>
          </div>
          <div>
            <dt>follower time</dt>
            <dd>{snapshot ? snapshot.followerTime.toFixed(2) : '-'} s</dd>
          </div>
          <div>
            <dt>drift</dt>
            <dd data-testid="yt-drift">
              {snapshot?.drift === null || snapshot?.drift === undefined
                ? '-'
                : `${snapshot.drift.toFixed(3)} s`}
            </dd>
          </div>
          <div>
            <dt>checks / corrections</dt>
            <dd data-testid="yt-corrections">
              {snapshot?.checks ?? 0} / {snapshot?.corrections ?? 0}
            </dd>
          </div>
        </dl>
      </section>
      <section className="panel" aria-label="Coordinator events">
        <h2>Coordinator events</h2>
        <pre style={{ maxHeight: 220 }}>{log.join('\n') || 'Waiting for events...'}</pre>
      </section>
    </>
  )
}
