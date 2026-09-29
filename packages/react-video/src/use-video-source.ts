import { useFrameSource } from '@videoglow/react'
import { createVideoSource } from '@videoglow/video'
import type { VideoFrameSource, VideoSourceOptions } from '@videoglow/video'

/**
 * Creates a `VideoFrameSource` for a `<video>` element.
 * Returns the source (null until the element mounts) and a callback ref.
 */
export function useVideoSource(
  options: VideoSourceOptions = {}
): [VideoFrameSource | null, (element: HTMLVideoElement | null) => void] {
  const { videoFrameCallback, frameCallbackTimeoutMs } = options
  return useFrameSource<HTMLVideoElement, VideoFrameSource>(
    (video) => createVideoSource(video, { videoFrameCallback, frameCallbackTimeoutMs }),
    [videoFrameCallback, frameCallbackTimeoutMs]
  )
}
