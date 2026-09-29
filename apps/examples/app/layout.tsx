import type { Metadata } from 'next'
import type { ReactNode } from 'react'
import { Bricolage_Grotesque, Instrument_Sans, JetBrains_Mono, Geist } from 'next/font/google'
import { SiteShell } from '@/components/site-shell'
import { SITE } from '@/lib/site'
import { SEO } from '@/lib/seo'
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
  title: { default: SEO.title, template: '%s · videoglow' },
  description: SEO.description,
  keywords: [...SEO.keywords],
  applicationName: 'videoglow',
  authors: [{ name: SITE.author.name, url: SITE.author.site }],
  creator: SITE.author.name,
  category: 'technology',
  icons: { icon: '/icon.svg' },
  alternates: { canonical: '/' },
  robots: { index: true, follow: true },
  openGraph: {
    type: 'website',
    locale: 'en_US',
    url: SITE.url,
    siteName: 'videoglow',
    title: SEO.ogTitle,
    description: SEO.description,
    images: [
      { url: '/og-image.png', width: 1200, height: 630, alt: SEO.ogTitle, type: 'image/png' },
    ],
  },
  twitter: {
    card: 'summary_large_image',
    title: SEO.ogTitle,
    description: SEO.description,
    images: ['/og-image.png'],
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
