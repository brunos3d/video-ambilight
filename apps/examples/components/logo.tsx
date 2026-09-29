/** The videoglow mark: a screen with a play glyph inside a color glow. Same artwork as app/icon.svg. */
export function Logo({ size = 28, className }: { size?: number; className?: string }) {
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
        <radialGradient id="videoglow-mark-glow" cx="50%" cy="50%" r="55%">
          <stop offset="0" stopColor="#ff7ad9" />
          <stop offset="0.45" stopColor="#8b7cff" stopOpacity="0.9" />
          <stop offset="1" stopColor="#22d3ee" stopOpacity="0" />
        </radialGradient>
      </defs>
      <rect width="64" height="64" rx="14" fill="#0b0b0f" />
      <ellipse cx="32" cy="32" rx="30" ry="25" fill="url(#videoglow-mark-glow)" />
      <rect
        x="15"
        y="19"
        width="34"
        height="24"
        rx="5"
        fill="#0b0b0f"
        stroke="#ececf1"
        strokeWidth="2.5"
      />
      <path d="M28 25v12l10-6z" fill="#ececf1" />
    </svg>
  )
}
