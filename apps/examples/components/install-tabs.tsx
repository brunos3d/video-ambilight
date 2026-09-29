'use client'

import { useSyncExternalStore } from 'react'
import { PackageOpen } from 'lucide-react'
import { CopyButton } from '@/components/copy-button'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import {
  installCommand,
  PACKAGE_MANAGERS,
  packageManagerStore,
  type PackageManager,
} from '@/lib/package-managers'

export interface InstallPackage {
  readonly name: string
  readonly comment?: string
}

/** Install instructions with one tab per package manager. The choice is remembered across pages. */
export function InstallTabs({
  packages,
  title = 'Install',
}: {
  packages: readonly InstallPackage[]
  title?: string
}) {
  const manager = useSyncExternalStore(
    packageManagerStore.subscribe,
    packageManagerStore.get,
    packageManagerStore.getServerSnapshot
  )
  const select = (value: string) => packageManagerStore.set(value as PackageManager)

  return (
    <div className="panel" data-testid="install-tabs">
      <Tabs value={manager} onValueChange={select}>
        <div className="flex flex-wrap items-center justify-between gap-3">
          <h2 className="!mb-0">
            <PackageOpen size={14} strokeWidth={1.75} aria-hidden="true" />
            {title}
          </h2>
          <TabsList aria-label="Package manager">
            {PACKAGE_MANAGERS.map((pm) => (
              <TabsTrigger key={pm} value={pm} className="px-3 font-mono text-xs">
                {pm}
              </TabsTrigger>
            ))}
          </TabsList>
        </div>
        {PACKAGE_MANAGERS.map((pm) => {
          const command = installCommand(pm, packages)
          return (
            <TabsContent key={pm} value={pm} className="mt-3">
              <div className="code-wrap">
                <CopyButton text={command} label={`Copy ${pm} command`} />
                <pre>
                  <code>{command}</code>
                </pre>
              </div>
            </TabsContent>
          )
        })}
      </Tabs>
    </div>
  )
}
