import {
  IconPlayerPause,
  IconPlayerPlay,
  IconRewindBackward10,
  IconRewindForward10,
} from '@tabler/icons-react'
import cx from 'classnames'
import { AnimatePresence, motion } from 'motion/react'
import { useCallback, useEffect, useRef, useState } from 'react'
import { useAutoResetState } from '../../hooks/useAutoResetState'
import { useIsFullScreen } from '../../hooks/useIsFullscreen'
import { usePlayer } from '../../hooks/usePlayer'
import { useEditorStore } from '../../store/useEditorStore'
import { Spinner } from '../Spinner'
import './VideoPlayer.css'
import { VideoPlayerControls } from './VideoPlayerControls'

export function VideoPlayer() {
  const containerRef = useRef<HTMLDivElement>(null)

  const { isPlaying, currentTime, duration, volume, isMuted, isLoading } =
    useEditorStore()

  const {
    attachCanvas,
    togglePlayback,
    seekTo,
    seekRelative,
    toggleMute,
    setVolume,
  } = usePlayer()

  const [isHovering, setIsHovering] = useState(false)
  const [isHoveringControls, setIsHoveringControls] = useState(false)
  const hideControlsTimeoutRef = useRef<number | null>(null)

  const [hasStarted, setHasStarted] = useState(false)
  const [playbackEffect, setPlaybackEffect] = useAutoResetState<
    'play' | 'pause' | 'forward' | 'backward' | null
  >(null, { after: 150 })

  // Reset hasStarted when a new video is loaded (duration resets to 0 then > 0)
  useEffect(() => {
    if (duration === 0) setHasStarted(false)
  }, [duration])

  useEffect(() => {
    if (isPlaying && !hasStarted) setHasStarted(true)
  }, [isPlaying, hasStarted])

  const handleMouseMove = () => {
    setIsHovering(true)
    if (hideControlsTimeoutRef.current) {
      window.clearTimeout(hideControlsTimeoutRef.current)
    }
    hideControlsTimeoutRef.current = window.setTimeout(() => {
      setIsHovering(false)
    }, 2500)
  }

  const handleMouseLeave = () => {
    setIsHovering(false)
    if (hideControlsTimeoutRef.current) {
      window.clearTimeout(hideControlsTimeoutRef.current)
    }
  }

  useEffect(() => {
    return () => {
      if (hideControlsTimeoutRef.current) {
        window.clearTimeout(hideControlsTimeoutRef.current)
      }
    }
  }, [])

  const showControls =
    (!isPlaying || isHovering || isHoveringControls) && !isLoading

  const triggerPlaybackToggle = useCallback(() => {
    const atEnd = duration > 0 && currentTime >= duration
    const willPlay = !isPlaying

    togglePlayback()

    if (!atEnd) setPlaybackEffect(willPlay ? 'play' : 'pause')
  }, [duration, currentTime, isPlaying, togglePlayback, setPlaybackEffect])

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (
        e.target instanceof HTMLInputElement ||
        e.target instanceof HTMLTextAreaElement
      )
        return

      switch (e.code) {
        case 'Space':
          e.preventDefault()
          triggerPlaybackToggle()
          break
        case 'ArrowLeft':
          e.preventDefault()
          seekRelative(-10)
          setPlaybackEffect('backward')
          break
        case 'ArrowRight':
          e.preventDefault()
          seekRelative(10)
          setPlaybackEffect('forward')
          break
        case 'Escape':
          if (document.fullscreenElement)
            document.exitFullscreen().catch(console.error)
          break
      }
    }

    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [triggerPlaybackToggle, seekRelative, setPlaybackEffect])

  const [isFullscreen, toggleFullscreen] = useIsFullScreen(containerRef)

  const isPristine = !hasStarted && duration > 0

  const handleSeekRelative = useCallback(
    (seconds: number) => {
      seekRelative(seconds)
      setPlaybackEffect(seconds < 0 ? 'backward' : 'forward')
    },
    [seekRelative, setPlaybackEffect],
  )

  return (
    <div
      ref={containerRef}
      className={cx('VideoPlayer', {
        'VideoPlayer--hide-cursor': isFullscreen && !showControls,
      })}
      onMouseMove={handleMouseMove}
      onMouseLeave={handleMouseLeave}
    >
      <div
        className="VideoPlayer__canvas-container"
        onClick={triggerPlaybackToggle}
      >
        <canvas ref={attachCanvas} className="VideoPlayer__canvas" />

        <AnimatePresence>
          {isPristine && !isLoading && (
            <motion.div
              className="VideoPlayer__center-icon VideoPlayer__pristine-play VideoPlayer__center-icon-bg"
              initial={{ opacity: 0, scale: 0.8, x: '-50%', y: '-50%' }}
              animate={{ opacity: 1, scale: 1, x: '-50%', y: '-50%' }}
              exit={{ opacity: 0, scale: 1.2, x: '-50%', y: '-50%' }}
            >
              <IconPlayerPlay size={64} fill="currentColor" />
            </motion.div>
          )}

          {playbackEffect && !isPristine && (
            <motion.div
              key={playbackEffect}
              className="VideoPlayer__center-icon VideoPlayer__center-icon-bg"
              initial={{ opacity: 0, scale: 0.8, x: '-50%', y: '-50%' }}
              animate={{ opacity: 1, scale: 1.2, x: '-50%', y: '-50%' }}
              exit={{ opacity: 0, scale: 1.4, x: '-50%', y: '-50%' }}
              transition={{ ease: 'easeOut' }}
            >
              {playbackEffect === 'play' && (
                <IconPlayerPlay size={64} fill="currentColor" />
              )}

              {playbackEffect === 'pause' && (
                <IconPlayerPause size={64} fill="currentColor" />
              )}

              {playbackEffect === 'backward' && (
                <IconRewindBackward10 size={64} stroke="currentColor" />
              )}

              {playbackEffect === 'forward' && (
                <IconRewindForward10 size={64} stroke="currentColor" />
              )}
            </motion.div>
          )}
        </AnimatePresence>

        {isLoading && (
          <div className="VideoPlayer__loading">
            <Spinner size={48} />
            <p>Processing media...</p>
          </div>
        )}
      </div>

      <VideoPlayerControls
        isVisible={showControls}
        isPlaying={isPlaying}
        isFullscreen={isFullscreen}
        currentTime={currentTime}
        duration={duration}
        volume={volume}
        isMuted={isMuted}
        onTogglePlayback={togglePlayback}
        onSeekTo={seekTo}
        onSeekRelative={handleSeekRelative}
        onToggleMute={toggleMute}
        onSetVolume={setVolume}
        onToggleFullscreen={toggleFullscreen}
        onMouseEnter={() => setIsHoveringControls(true)}
        onMouseLeave={() => setIsHoveringControls(false)}
      />
    </div>
  )
}
