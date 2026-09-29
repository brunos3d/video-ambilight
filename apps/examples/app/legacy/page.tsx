import { CodeBlock } from '@/components/code-block'
import { DemoHeader } from '@/components/demo-header'
import { LegacyDemo } from '@/components/legacy-demo'

const CODE = `
import { VideoAmbilight } from 'react-ambilight'
import 'react-ambilight/dist/style.css' // still resolves; now empty

export const metadata = {
  title: 'react-ambilight 1.x API',
  alternates: { canonical: '/legacy' },
}

<VideoAmbilight videoId="I5QDO6BsWnU" />
`

export default function LegacyPage() {
  return (
    <>
      <DemoHeader route="/legacy" />
      <LegacyDemo />
      <CodeBlock title="Unchanged 1.x usage" code={CODE} />
      <div className="panel">
        <h2>Migration</h2>
        <p>
          <code>react-ambilight@2</code> is a thin wrapper over{' '}
          <code>@videoglow/react-youtube</code>. See docs/architecture/migration.md for the mapping
          of props and types.
        </p>
      </div>
    </>
  )
}
