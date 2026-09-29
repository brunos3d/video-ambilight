'use client'

import type { Ambilight } from '@videoglow/core'
import { useAmbilightState } from '@videoglow/react'

function fixed(value: number, digits = 3): string {
  return value.toFixed(digits)
}

/** Live engine statistics. Values carry test ids so the e2e suite can read them. */
export function StatsPanel({
  ambilight,
  title = 'Engine state',
}: {
  ambilight: Ambilight | null
  title?: string
}) {
  const state = useAmbilightState(ambilight)
  return (
    <section className="panel" aria-label={title}>
      <h2>{title}</h2>
      <dl className="stats">
        <div>
          <dt>running</dt>
          <dd data-testid="stat-running">{String(state.running)}</dd>
        </div>
        <div>
          <dt>sampling</dt>
          <dd data-testid="stat-sampling">{String(state.sampling)}</dd>
        </div>
        <div>
          <dt>visible</dt>
          <dd data-testid="stat-visible">{String(state.visible)}</dd>
        </div>
        <div>
          <dt>source</dt>
          <dd data-testid="stat-source">
            {state.sourceKind ?? 'none'} / {state.sourceMode ?? '-'}
          </dd>
        </div>
        <div>
          <dt>frames rendered</dt>
          <dd data-testid="stat-frames">{state.framesRendered}</dd>
        </div>
        <div>
          <dt>frames skipped (fps cap)</dt>
          <dd data-testid="stat-skipped">{state.framesSkipped}</dd>
        </div>
        <div>
          <dt>buffer</dt>
          <dd data-testid="stat-buffer">
            {state.bufferWidth}x{state.bufferHeight}
          </dd>
        </div>
        <div>
          <dt>last render</dt>
          <dd data-testid="stat-last-ms">{fixed(state.lastRenderDurationMs)} ms</dd>
        </div>
        <div>
          <dt>average render</dt>
          <dd data-testid="stat-avg-ms">{fixed(state.averageRenderDurationMs)} ms</dd>
        </div>
        <div>
          <dt>render errors</dt>
          <dd data-testid="stat-errors">{state.renderErrors}</dd>
        </div>
      </dl>
    </section>
  )
}
