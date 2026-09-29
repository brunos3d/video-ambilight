import type { MetadataRoute } from 'next'
import { DEMOS, SITE } from '@/lib/site'

export default function sitemap(): MetadataRoute.Sitemap {
  const now = new Date()
  return [
    { url: SITE.url, lastModified: now, changeFrequency: 'weekly', priority: 1 },
    ...DEMOS.map((demo) => ({
      url: `${SITE.url}${demo.href}`,
      lastModified: now,
      changeFrequency: 'monthly' as const,
      priority: 0.7,
    })),
  ]
}
