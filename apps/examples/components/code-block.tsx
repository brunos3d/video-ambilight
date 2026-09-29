import { Terminal } from 'lucide-react'
import { CopyButton } from '@/components/copy-button'

export function CodeBlock({ code, title }: { code: string; title?: string }) {
  const trimmed = code.trim()
  return (
    <div className="panel">
      {title ? (
        <h2>
          <Terminal size={14} strokeWidth={1.75} aria-hidden="true" />
          {title}
        </h2>
      ) : null}
      <div className="code-wrap">
        <CopyButton text={trimmed} />
        <pre>
          <code>{trimmed}</code>
        </pre>
      </div>
    </div>
  )
}
