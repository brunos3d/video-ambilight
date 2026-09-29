import Link from 'next/link'
import { ArrowRight, Blend, Gauge, Layers, ShieldCheck } from 'lucide-react'
import { GitHubIcon, NpmIcon } from '@/components/brand-icons'
import { Brand } from '@/components/brand'
import { InstallTabs } from '@/components/install-tabs'
import { DEMO_GROUPS, SITE } from '@/lib/site'

const INSTALL = [
  { name: '@videoglow/react-video', comment: 'native <video>' },
  { name: '@videoglow/react-youtube', comment: 'YouTube' },
  { name: '@videoglow/core', comment: 'engine only, no React' },
]

const PRINCIPLES = [
  {
    icon: Layers,
    title: 'Core first',
    text: 'A framework-agnostic engine samples frames into a small canvas. React, video, canvas and YouTube plug into it.',
  },
  {
    icon: Blend,
    title: 'Blur on the compositor',
    text: 'The glow is a CSS filter on a 160 px buffer. No pixels are read back, so cross-origin media just works.',
  },
  {
    icon: Gauge,
    title: 'Frame-aware sampling',
    text: 'requestVideoFrameCallback drives the glow; a 30 fps cap and visibility gating keep the main thread idle.',
  },
  {
    icon: ShieldCheck,
    title: 'Honest about YouTube',
    text: 'Iframe pixels cannot be read. A muted second player follows the visible one through an explicit drift policy.',
  },
]

export default function HomePage() {
  return (
    <>
      <section className="hero">
        <div className="hero-brand">
          <Brand size="lg" />
        </div>
        <h1 className="hero-title">
          Ambient light for the web&apos;s <em>moving pictures</em>.
        </h1>
        <p className="lede hero-lede">{SITE.description}</p>
        <div className="hero-actions">
          <Link href="/native-video" className="button button-primary">
            See it run
            <ArrowRight size={16} aria-hidden="true" />
          </Link>
          <a className="button" href={SITE.repo} target="_blank" rel="noreferrer">
            <GitHubIcon size={15} />
            GitHub
          </a>
          <a className="button" href={SITE.npm} target="_blank" rel="noreferrer">
            <NpmIcon size={15} />
            npm
          </a>
        </div>
      </section>

      <InstallTabs packages={INSTALL} />

      <section className="principles" aria-label="Design principles">
        {PRINCIPLES.map(({ icon: Icon, title, text }) => (
          <div key={title} className="principle">
            <Icon size={18} strokeWidth={1.75} aria-hidden="true" />
            <h2>{title}</h2>
            <p>{text}</p>
          </div>
        ))}
      </section>

      {DEMO_GROUPS.map((group) => (
        <section key={group.label} className="demo-group">
          <h2 className="section-title">{group.label}</h2>
          <div className="cards">
            {group.routes.map((demo) => {
              const Icon = demo.icon
              return (
                <Link key={demo.href} href={demo.href} className="card">
                  <span className="card-icon" aria-hidden="true">
                    <Icon size={18} strokeWidth={1.75} />
                  </span>
                  <h3>{demo.title}</h3>
                  <p>{demo.summary}</p>
                  <span className="pill">{demo.packages[0]}</span>
                </Link>
              )
            })}
          </div>
        </section>
      ))}
    </>
  )
}
