import Link from 'next/link'
import { Logo } from '@/components/logo'

/**
 * Logo plus wordmark. The wordmark carries a slow ambient glow that peaks
 * every few seconds and flares on hover, echoing the effect the library makes.
 */
export function Brand({ size = 'sm' }: { size?: 'sm' | 'lg' }) {
  const large = size === 'lg'
  return (
    <Link href="/" className="brand group" aria-label="videoglow home">
      <span className="brand-halo" aria-hidden="true" />
      <Logo size={large ? 56 : 30} animated />
      <span className={`wordmark ${large ? 'wordmark-lg' : ''}`} data-text="videoglow">
        videoglow
      </span>
    </Link>
  )
}
