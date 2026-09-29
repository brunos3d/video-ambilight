'use client'

import { useState } from 'react'
import type { Ambilight } from '@videoglow/core'
import { VideoAmbilight } from '@videoglow/react-video'
import { MEDIA } from '@/lib/media'
import { StatsPanel } from '@/components/stats-panel'

interface Settings {
  blur: number
  opacity: number
  saturation: number
  brightness: number
  scale: number
  fps: number
  resolution: number
}

const DEFAULTS: Settings = {
  blur: 80,
  opacity: 0.5,
  saturation: 3,
  brightness: 1,
  scale: 1.15,
  fps: 30,
  resolution: 160,
}

const CONTROLS: Array<{
  key: keyof Settings
  min: number
  max: number
  step: number
  label: string
}> = [
  { key: 'blur', min: 0, max: 200, step: 1, label: 'blur (px)' },
  { key: 'opacity', min: 0, max: 1, step: 0.05, label: 'opacity' },
  { key: 'saturation', min: 0, max: 6, step: 0.1, label: 'saturation' },
  { key: 'brightness', min: 0, max: 3, step: 0.1, label: 'brightness' },
  { key: 'scale', min: 0.8, max: 1.6, step: 0.01, label: 'scale' },
  { key: 'fps', min: 0, max: 60, step: 1, label: 'fps cap (0 = uncapped)' },
  { key: 'resolution', min: 8, max: 640, step: 8, label: 'buffer resolution (px)' },
]

export function ConfigurationDemo() {
  const [settings, setSettings] = useState<Settings>(DEFAULTS)
  const [ambilight, setAmbilight] = useState<Ambilight | null>(null)
  return (
    <>
      <div className="stage">
        <VideoAmbilight
          ambilightRef={setAmbilight}
          data-testid="config-video"
          videoClassName="video-rounded"
          src={MEDIA.pattern.webm}
          controls
          muted
          loop
          autoPlay
          playsInline
          {...settings}
        />
      </div>
      <section className="panel" aria-label="Controls">
        <h2>Controls</h2>
        <div className="controls">
          {CONTROLS.map((control) => (
            <label key={control.key}>
              <span>
                {control.label}:{' '}
                <output data-testid={`value-${control.key}`}>{settings[control.key]}</output>
              </span>
              <input
                type="range"
                data-testid={`control-${control.key}`}
                min={control.min}
                max={control.max}
                step={control.step}
                value={settings[control.key]}
                onChange={(event) =>
                  setSettings((s) => ({ ...s, [control.key]: Number(event.target.value) }))
                }
              />
            </label>
          ))}
        </div>
        <div className="button-row">
          <button type="button" onClick={() => setSettings(DEFAULTS)}>
            Reset
          </button>
        </div>
      </section>
      <StatsPanel ambilight={ambilight} />
      <pre data-testid="config-json">{JSON.stringify(settings, null, 2)}</pre>
    </>
  )
}
