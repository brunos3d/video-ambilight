import { siGithub, siNpm, siStorybook, siYoutube } from 'simple-icons'

type SimpleIcon = { readonly path: string; readonly title: string }

function BrandIcon({
  icon,
  size = 16,
  className,
}: {
  icon: SimpleIcon
  size?: number
  className?: string
}) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="currentColor"
      aria-hidden="true"
      focusable="false"
      className={className}
    >
      <path d={icon.path} />
    </svg>
  )
}

export const GitHubIcon = (props: { size?: number; className?: string }) => (
  <BrandIcon icon={siGithub} {...props} />
)
export const NpmIcon = (props: { size?: number; className?: string }) => (
  <BrandIcon icon={siNpm} {...props} />
)
export const YouTubeIcon = (props: { size?: number; className?: string }) => (
  <BrandIcon icon={siYoutube} {...props} />
)
export const StorybookIcon = (props: { size?: number; className?: string }) => (
  <BrandIcon icon={siStorybook} {...props} />
)
