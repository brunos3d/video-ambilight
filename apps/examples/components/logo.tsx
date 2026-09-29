/**
 * The videoglow mark: a screen floating in its own ambient light.
 * Three blurred light sources in the project's accent colors sit behind a
 * dark bezel; the bezel carries a thin highlight and a play glyph.
 * `animated` slowly drifts the lights, echoing the effect itself.
 */
export function Logo({
  size = 28,
  animated = false,
  className,
}: {
  size?: number
  animated?: boolean
  className?: string
}) {
  const id = animated ? 'vg-mark-a' : 'vg-mark-s'
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 64 64"
      role="img"
      aria-label="videoglow logo"
      className={className}
      style={{ flexShrink: 0 }}
    >
      <defs>
        <clipPath id={`${id}-clip`}>
          <rect width="64" height="64" rx="9" />
        </clipPath>
        <filter id={`${id}-blur`} x="-50%" y="-50%" width="200%" height="200%">
          <feGaussianBlur stdDeviation="7" />
        </filter>
        <linearGradient id={`${id}-bezel`} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#2a2a36" />
          <stop offset="1" stopColor="#101016" />
        </linearGradient>
        <linearGradient id={`${id}-shine`} x1="0" y1="0" x2="1" y2="0">
          <stop offset="0" stopColor="#ffffff" stopOpacity="0" />
          <stop offset="0.5" stopColor="#ffffff" stopOpacity="0.55" />
          <stop offset="1" stopColor="#ffffff" stopOpacity="0" />
        </linearGradient>
      </defs>
      <rect width="64" height="64" rx="9" fill="#0a0a0f" />
      <g
        clipPath={`url(#${id}-clip)`}
        filter={`url(#${id}-blur)`}
        className={animated ? 'vg-mark-lights' : undefined}
      >
        <ellipse cx="18" cy="24" rx="20" ry="16" fill="#ff5fd0" className="vg-mark-light" />
        <ellipse cx="46" cy="22" rx="20" ry="16" fill="#22d3ee" className="vg-mark-light" />
        <ellipse cx="34" cy="46" rx="24" ry="16" fill="#8b7cff" className="vg-mark-light" />
      </g>
      <rect
        x="13"
        y="18"
        width="38"
        height="27"
        rx="6"
        fill={`url(#${id}-bezel)`}
        stroke="#0a0a0f"
        strokeWidth="2.5"
      />
      <rect x="16" y="21" width="32" height="21" rx="4" fill="#07070b" />
      <rect x="18" y="21.5" width="28" height="1.2" fill={`url(#${id}-shine)`} />
      <path d="M28.5 26.5v10l9.5-5z" fill="#f4f4f8" />
      <rect x="26" y="47" width="12" height="2" rx="1" fill="#2a2a36" />
    </svg>
  )
}
