import { cleanup, render } from '@testing-library/react'
import { afterEach, describe, it } from 'vitest'
import VideoAmbilight from './index'

describe('VideoAmbilight test:', () => {
  afterEach(cleanup)

  it('should render component', () => {
    render(<VideoAmbilight videoId='ASzOzrB-a9E' />)
  })
})
