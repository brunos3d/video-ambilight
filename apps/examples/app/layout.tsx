import type { Metadata } from 'next'
import type { ReactNode } from 'react'
import { Bricolage_Grotesque, Instrument_Sans, JetBrains_Mono, Geist } from 'next/font/google'
import { SiteShell } from '@/components/site-shell'
import { SITE } from '@/lib/site'
import './globals.css'
import { cn } from '@/lib/utils'

const geist = Geist({ subsets: ['latin'], variable: '--font-sans' })

const display = Bricolage_Grotesque({
  subsets: ['latin'],
  variable: '--font-display',
  axes: ['wdth', 'opsz'],
})
const body = Instrument_Sans({ subsets: ['latin'], variable: '--font-body' })
const mono = JetBrains_Mono({ subsets: ['latin'], variable: '--font-mono' })

export const metadata: Metadata = {
  metadataBase: new URL(SITE.url),
  title: { default: 'videoglow', template: '%s · videoglow' },
  description: SITE.description,
  icons: { icon: '/icon.svg' },
  authors: [{ name: SITE.author.name, url: SITE.author.site }],
  openGraph: {
    title: 'videoglow',
    description: SITE.description,
    url: SITE.url,
    siteName: 'videoglow',
    images: ['/videoglow-logo.svg'],
    type: 'website',
  },
}

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html
      lang="en"
      className={cn(display.variable, body.variable, mono.variable, 'font-sans', geist.variable)}
    >
      <body>
        <SiteShell>{children}</SiteShell>
      </body>
    </html>
  )
}
