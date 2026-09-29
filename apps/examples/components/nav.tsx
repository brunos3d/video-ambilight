'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { DEMOS } from '@/lib/site'
import { Logo } from '@/components/logo'

export function Nav() {
  const pathname = usePathname()
  return (
    <>
      <Link href="/" className="brand">
        <Logo size={28} />
        <span>videoglow</span>
      </Link>
      <nav className="nav" aria-label="Demos">
        <Link href="/" aria-current={pathname === '/' ? 'page' : undefined}>
          Overview
        </Link>
        {DEMOS.map((demo) => (
          <Link
            key={demo.href}
            href={demo.href}
            aria-current={pathname === demo.href ? 'page' : undefined}
          >
            {demo.title}
          </Link>
        ))}
      </nav>
      <div className="nav-footer">
        <a href="https://github.com/brunos3d/video-ambilight">GitHub</a>
        <br />
        <a href="https://www.npmjs.com/org/videoglow">npm</a>
      </div>
    </>
  )
}
