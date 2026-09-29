import Link from 'next/link'
import { DEMOS } from '@/lib/site'
import { CodeBlock } from '@/components/code-block'
import { Logo } from '@/components/logo'

const INSTALL = `
pnpm add @videoglow/react-video   # native <video>
pnpm add @videoglow/react-youtube # YouTube
pnpm add @videoglow/core          # engine only, no React
`

export default function HomePage() {
  return (
    <>
      <header className="demo-header">
        <h1 className="home-title">
          <Logo size={44} />
          videoglow
        </h1>
        <p>
          Ambilight style glow behind video, canvas and YouTube content. A framework-agnostic core
          samples frames into a small canvas and lets the compositor blur it. React, native video,
          canvas and YouTube are separate packages that plug into the same engine.
        </p>
      </header>
      <CodeBlock title="Install" code={INSTALL} />
      <div className="cards">
        {DEMOS.map((demo) => (
          <Link key={demo.href} href={demo.href} className="card">
            <h2>{demo.title}</h2>
            <p>{demo.summary}</p>
            <span className="pill">{demo.packages[0]}</span>
          </Link>
        ))}
      </div>
    </>
  )
}
