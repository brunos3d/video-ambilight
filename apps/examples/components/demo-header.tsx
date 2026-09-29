import type { DemoRoute } from '@/lib/site'
import { DEMOS } from '@/lib/site'

export function DemoHeader({
  route,
  children,
}: {
  route: DemoRoute['href']
  children?: React.ReactNode
}) {
  const demo = DEMOS.find((d) => d.href === route)
  if (!demo) throw new Error(`Unknown demo route ${route}`)
  return (
    <header className="demo-header">
      <h1>{demo.title}</h1>
      <p>{demo.summary}</p>
      {children}
      <div className="pill-row">
        {demo.packages.map((name) => (
          <span key={name} className="pill">
            {name}
          </span>
        ))}
      </div>
    </header>
  )
}
