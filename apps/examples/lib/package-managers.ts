export type PackageManager = 'pnpm' | 'npm' | 'yarn' | 'bun'

export const PACKAGE_MANAGERS: readonly PackageManager[] = ['npm', 'pnpm', 'yarn', 'bun']

const ADD: Record<PackageManager, string> = {
  pnpm: 'pnpm add',
  npm: 'npm install',
  yarn: 'yarn add',
  bun: 'bun add',
}

/** One install line per package, aligned so trailing comments line up. */
export function installCommand(
  manager: PackageManager,
  packages: readonly { name: string; comment?: string }[]
): string {
  const width = Math.max(...packages.map((p) => p.name.length))
  return packages
    .map((p) => {
      const line = `${ADD[manager]} ${p.name}`
      return p.comment ? `${line.padEnd(ADD[manager].length + 1 + width)}  # ${p.comment}` : line
    })
    .join('\n')
}

const STORAGE_KEY = 'videoglow:package-manager'
const CHANGE_EVENT = 'videoglow:package-manager-change'

function isPackageManager(value: string | null): value is PackageManager {
  return value !== null && (PACKAGE_MANAGERS as readonly string[]).includes(value)
}

/** External store for the preferred package manager, shared by every InstallTabs on the page. */
export const packageManagerStore = {
  get(): PackageManager {
    try {
      const stored = window.localStorage.getItem(STORAGE_KEY)
      return isPackageManager(stored) ? stored : 'npm'
    } catch {
      return 'npm'
    }
  },
  getServerSnapshot(): PackageManager {
    return 'npm'
  },
  set(next: PackageManager): void {
    try {
      window.localStorage.setItem(STORAGE_KEY, next)
    } catch {
      // Storage may be unavailable; listeners still get the in-memory change.
    }
    window.dispatchEvent(new Event(CHANGE_EVENT))
  },
  subscribe(listener: () => void): () => void {
    window.addEventListener(CHANGE_EVENT, listener)
    window.addEventListener('storage', listener)
    return () => {
      window.removeEventListener(CHANGE_EVENT, listener)
      window.removeEventListener('storage', listener)
    }
  },
}
