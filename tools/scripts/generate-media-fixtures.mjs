// Generates deterministic test videos with ffmpeg. Run: pnpm fixtures:media
// Output: apps/examples/public/media/{pattern.webm,pattern-vertical.webm}
// VP9/WebM plays in every current browser, including Safari 14.1+ and Playwright's Chromium.
import { execFileSync } from 'node:child_process'
import { mkdirSync } from 'node:fs'

const out = 'apps/examples/public/media'
mkdirSync(out, { recursive: true })

const filters = {
  // Colorful moving pattern: rotating hue over a test source so the glow visibly changes over time.
  pattern: 'testsrc2=size=640x360:rate=30,hue=h=t*60:s=2',
  vertical: 'testsrc2=size=360x640:rate=30,hue=h=t*90:s=2',
}

function run(args) {
  execFileSync('ffmpeg', ['-y', '-loglevel', 'error', ...args], { stdio: 'inherit' })
}

run([
  '-f',
  'lavfi',
  '-i',
  filters.pattern,
  '-t',
  '10',
  '-c:v',
  'libvpx-vp9',
  '-b:v',
  '350k',
  '-pix_fmt',
  'yuv420p',
  `${out}/pattern.webm`,
])
run([
  '-f',
  'lavfi',
  '-i',
  filters.vertical,
  '-t',
  '10',
  '-c:v',
  'libvpx-vp9',
  '-b:v',
  '350k',
  '-pix_fmt',
  'yuv420p',
  `${out}/pattern-vertical.webm`,
])
console.log('media fixtures written to', out)
