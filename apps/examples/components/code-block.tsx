export function CodeBlock({ code, title }: { code: string; title?: string }) {
  return (
    <div className="panel">
      {title ? <h2>{title}</h2> : null}
      <pre>
        <code>{code.trim()}</code>
      </pre>
    </div>
  )
}
