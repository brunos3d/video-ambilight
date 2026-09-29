import type { ReactNode } from 'react'
import { DEMOS, type DemoHref } from '@/lib/site'
import { InstallTabs } from '@/components/install-tabs'

export function DemoHeader({ route, children }: { route: DemoHref; children?: ReactNode }) {
  const demo = DEMOS.find((d) => d.href === route)
  if (!demo) throw new Error(`Unknown demo route ${route}`)
  const Icon = demo.icon
  return (
    <header className="demo-header">
      <p className="eyebrow">
        <Icon size={14} strokeWidth={2.25} aria-hidden="true" />
        Demo
      </p>
      <h1>{demo.title}</h1>
      <p className="lede">{demo.summary}</p>
      {children}
      <div className="pill-row">
        {demo.packages.map((name) => (
          <a
            key={name}
            className="pill"
            href={`https://www.npmjs.com/package/${name}`}
            target="_blank"
            rel="noreferrer"
          >
            {name}
          </a>
        ))}
      </div>
      <InstallTabs packages={demo.packages.map((name) => ({ name }))} />
    </header>
  )
}
