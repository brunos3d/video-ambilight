// Renders public/og-image.png (1200x630) once, at development time. Run: pnpm og:generate
// Uses next/og (Satori + resvg) so the artwork shares the site's tokens without extra dependencies.
// Written without JSX so Node can run it directly with type stripping.
import { readFile, writeFile } from 'node:fs/promises'
import { dirname, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'
import { createElement as h } from 'react'
import { ImageResponse } from 'next/og.js'
import { SEO } from '../lib/seo.ts'

const here = dirname(fileURLToPath(import.meta.url))
const size = { width: 1200, height: 630 }
const PACKAGES = ['@videoglow/core', '@videoglow/react-video', '@videoglow/react-youtube']

type Style = Record<string, string | number>
const div = (style: Style, ...children: unknown[]) => h('div', { style }, ...children)

function ambient() {
  const stops = (color: string, a0: number, a1: number) => [
    h('stop', { offset: '0%', stopColor: color, stopOpacity: a0 }),
    h('stop', { offset: '45%', stopColor: color, stopOpacity: a1 }),
    h('stop', { offset: '100%', stopColor: color, stopOpacity: 0 }),
  ]
  return h(
    'svg',
    {
      width: 1200,
      height: 630,
      viewBox: '0 0 1200 630',
      style: { position: 'absolute', left: 0, top: 0 },
    },
    h(
      'defs',
      null,
      h(
        'radialGradient',
        { id: 'violet', cx: '50%', cy: '50%', r: '50%' },
        ...stops('#8b7cff', 0.75, 0.28)
      ),
      h(
        'radialGradient',
        { id: 'cyan', cx: '50%', cy: '50%', r: '50%' },
        ...stops('#22d3ee', 0.6, 0.2)
      ),
      h(
        'radialGradient',
        { id: 'pink', cx: '50%', cy: '50%', r: '50%' },
        ...stops('#ff5fd0', 0.6, 0.22)
      )
    ),
    h('circle', { cx: 140, cy: 40, r: 620, fill: 'url(#violet)' }),
    h('circle', { cx: 1080, cy: 60, r: 560, fill: 'url(#cyan)' }),
    h('circle', { cx: 620, cy: 660, r: 620, fill: 'url(#pink)' })
  )
}

function mark() {
  const center: Style = { display: 'flex', alignItems: 'center', justifyContent: 'center' }
  return div(
    {
      width: 112,
      height: 112,
      borderRadius: 18,
      background: 'linear-gradient(135deg, #ff5fd0 0%, #8b7cff 52%, #22d3ee 100%)',
      ...center,
    },
    div(
      {
        width: 100,
        height: 100,
        borderRadius: 14,
        background: 'linear-gradient(180deg, rgba(10,10,15,0.55) 0%, rgba(10,10,15,0.85) 100%)',
        ...center,
      },
      div(
        {
          width: 64,
          height: 46,
          borderRadius: 10,
          background: '#07070b',
          border: '3px solid #3a3a48',
          ...center,
        },
        h(
          'svg',
          { width: 20, height: 22, viewBox: '0 0 20 22' },
          h('path', { d: 'M2 1v20l17-10z', fill: '#f4f4f8' })
        )
      )
    )
  )
}

function composition(fontFamily: string) {
  return div(
    {
      width: '100%',
      height: '100%',
      display: 'flex',
      flexDirection: 'column',
      justifyContent: 'space-between',
      padding: '60px 72px',
      background: '#08080c',
      color: '#ececf1',
      fontFamily,
      position: 'relative',
      overflow: 'hidden',
    },
    ambient(),
    div(
      { display: 'flex', alignItems: 'center', gap: 28 },
      mark(),
      div(
        { display: 'flex', flexDirection: 'column' },
        div({ fontSize: 64, fontWeight: 700, letterSpacing: -2, lineHeight: 1 }, 'videoglow'),
        div({ fontSize: 24, color: '#b0b0c0', marginTop: 10 }, SEO.tagline)
      )
    ),
    div(
      { display: 'flex', flexDirection: 'column', gap: 18, maxWidth: 1000 },
      div(
        { fontSize: 52, fontWeight: 700, lineHeight: 1.08, letterSpacing: -1.5 },
        'Ambilight glow for HTML video, canvas and YouTube'
      ),
      div(
        { fontSize: 26, color: '#c4c4d2', lineHeight: 1.35 },
        'Framework-agnostic core. React and Next.js components. GPU-friendly, no pixel readback.'
      )
    ),
    div(
      { display: 'flex', alignItems: 'center', justifyContent: 'space-between' },
      div(
        { display: 'flex', gap: 12 },
        ...PACKAGES.map((name) =>
          div(
            {
              padding: '8px 16px',
              borderRadius: 9999,
              border: '1px solid #34344a',
              background: 'rgba(15,15,21,0.85)',
              color: '#d6d6e2',
              fontSize: 20,
            },
            name
          )
        )
      ),
      div({ fontSize: 22, color: '#a0a0b4' }, 'videoglow.brunosilva.io')
    )
  )
}

async function main() {
  const font = await readFile(resolve(here, 'assets/Roboto-Bold.ttf'))
  const fontData = font.buffer.slice(
    font.byteOffset,
    font.byteOffset + font.byteLength
  ) as ArrayBuffer
  const response = new ImageResponse(composition('Roboto'), {
    ...size,
    fonts: [{ name: 'Roboto', data: fontData, weight: 700, style: 'normal' }],
  })
  const png = Buffer.from(await response.arrayBuffer())
  const out = resolve(here, '../public/og-image.png')
  await writeFile(out, png)
  console.log(`wrote ${out} (${(png.length / 1024).toFixed(1)} KB)`)
}

await main()
