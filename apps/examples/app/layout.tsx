import type { Metadata } from 'next'
import type { ReactNode } from 'react'
import { Nav } from '@/components/nav'
import './globals.css'

export const metadata: Metadata = {
  title: 'videoglow examples',
  description:
    'Ambilight style glow for video, canvas and YouTube. Framework-agnostic core with React integrations.',
}

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="en">
      <body>
        <div className="site">
          <aside className="sidebar">
            <Nav />
          </aside>
          <main className="content">{children}</main>
        </div>
      </body>
    </html>
  )
}
