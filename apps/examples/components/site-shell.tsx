'use client'

import { useEffect, useState, type ReactNode } from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { ExternalLink, Globe, Menu, X } from 'lucide-react'
import { Brand } from '@/components/brand'
import { GitHubIcon, NpmIcon, StorybookIcon } from '@/components/brand-icons'
import { DEMO_GROUPS, SITE } from '@/lib/site'

function NavLinks({ onNavigate }: { onNavigate?: () => void }) {
  const pathname = usePathname()
  return (
    <nav className="sidebar-nav" aria-label="Documentation">
      <div className="nav-group">
        <Link
          href="/"
          aria-current={pathname === '/' ? 'page' : undefined}
          className="nav-link"
          onClick={onNavigate}
        >
          <span className="nav-dot" aria-hidden="true" />
          Overview
        </Link>
        <a
          className="nav-link"
          href={SITE.storybook}
          target="_blank"
          rel="noreferrer"
          onClick={onNavigate}
        >
          <StorybookIcon size={15} />
          Storybook
          <ExternalLink size={12} aria-hidden="true" className="ml-auto opacity-50" />
        </a>
      </div>
      {DEMO_GROUPS.map((group) => (
        <div className="nav-group" key={group.label}>
          <p className="nav-label">{group.label}</p>
          {group.routes.map((route) => {
            const Icon = route.icon
            return (
              <Link
                key={route.href}
                href={route.href}
                aria-current={pathname === route.href ? 'page' : undefined}
                className="nav-link"
                onClick={onNavigate}
              >
                <Icon size={15} strokeWidth={2.25} aria-hidden="true" />
                {route.title}
              </Link>
            )
          })}
        </div>
      ))}
    </nav>
  )
}

function FooterLink({ href, icon, label }: { href: string; icon: ReactNode; label: string }) {
  return (
    <a className="footer-link" href={href} target="_blank" rel="noreferrer">
      {icon}
      <span>{label}</span>
      <ExternalLink size={12} aria-hidden="true" className="ml-auto opacity-50" />
    </a>
  )
}

function ProjectLinks() {
  return (
    <div className="sidebar-footer">
      <p className="nav-label">Project</p>
      <FooterLink href={SITE.repo} icon={<GitHubIcon size={15} />} label="Source on GitHub" />
      <FooterLink href={SITE.npm} icon={<NpmIcon size={15} />} label="@videoglow on npm" />
      <p className="nav-label nav-label-gap">Author</p>
      <FooterLink
        href={SITE.author.site}
        icon={<Globe size={15} strokeWidth={2.25} aria-hidden="true" />}
        label={SITE.author.name}
      />
      <FooterLink href={SITE.author.github} icon={<GitHubIcon size={15} />} label="@brunos3d" />
    </div>
  )
}

export function SiteShell({ children }: { children: ReactNode }) {
  const [open, setOpen] = useState(false)
  const pathname = usePathname()

  useEffect(() => {
    document.body.classList.toggle('drawer-open', open)
    return () => document.body.classList.remove('drawer-open')
  }, [open])

  useEffect(() => {
    if (!open) return
    const onKey = (event: KeyboardEvent) => {
      if (event.key === 'Escape') setOpen(false)
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [open])

  return (
    <div className="site">
      <header className="topbar">
        <button
          type="button"
          className="icon-button"
          aria-label={open ? 'Close navigation' : 'Open navigation'}
          aria-expanded={open}
          aria-controls="site-sidebar"
          onClick={() => setOpen((v) => !v)}
        >
          {open ? <X size={18} /> : <Menu size={18} />}
        </button>
        <Brand />
        <div className="topbar-links">
          <a
            className="icon-button"
            href={SITE.repo}
            target="_blank"
            rel="noreferrer"
            aria-label="GitHub repository"
          >
            <GitHubIcon size={16} />
          </a>
          <a
            className="icon-button"
            href={SITE.npm}
            target="_blank"
            rel="noreferrer"
            aria-label="npm organization"
          >
            <NpmIcon size={16} />
          </a>
        </div>
      </header>

      <aside id="site-sidebar" className="sidebar" data-open={open ? 'true' : 'false'}>
        <div className="sidebar-brand">
          <Brand />
        </div>
        <NavLinks onNavigate={() => setOpen(false)} />
        <ProjectLinks />
      </aside>

      {open ? (
        <button
          type="button"
          className="scrim"
          aria-label="Close navigation"
          onClick={() => setOpen(false)}
        />
      ) : null}

      <main className="content" key={pathname}>
        {children}
        <footer className="page-footer">
          <span>
            Built by{' '}
            <a href={SITE.author.site} target="_blank" rel="noreferrer">
              {SITE.author.name}
            </a>
            . MIT licensed.
          </span>
          <span className="page-footer-links">
            <a href={SITE.repo} target="_blank" rel="noreferrer">
              GitHub
            </a>
            <a href={SITE.npm} target="_blank" rel="noreferrer">
              npm
            </a>
            <a href={SITE.storybook} target="_blank" rel="noreferrer">
              Storybook
            </a>
            <a href={SITE.author.github} target="_blank" rel="noreferrer">
              @brunos3d
            </a>
          </span>
        </footer>
      </main>
    </div>
  )
}
