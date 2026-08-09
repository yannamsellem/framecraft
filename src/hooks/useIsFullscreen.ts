import { useCallback, useEffect, useState } from 'react'

export function useIsFullScreen(
  ref: React.RefObject<HTMLElement | null>,
): [boolean, () => void] {
  const [isFullscreen, setIsFullscreen] = useState(false)

  useEffect(() => {
    const handleFullscreenChange = () =>
      setIsFullscreen(document.fullscreenElement === ref.current)

    document.addEventListener('fullscreenchange', handleFullscreenChange)
    return () => {
      document.removeEventListener('fullscreenchange', handleFullscreenChange)
    }
  }, [ref])

  const toggleFullscreen = useCallback(() => {
    if (!ref?.current) return
    if (!document.fullscreenElement) {
      ref.current
        .requestFullscreen()
        .catch((err) =>
          console.error('Error attempting to enable full-screen mode:', err),
        )
    } else {
      document
        .exitFullscreen()
        .catch((err) =>
          console.error('Error attempting to exit full-screen mode:', err),
        )
    }
  }, [ref])

  return [isFullscreen, toggleFullscreen]
}
