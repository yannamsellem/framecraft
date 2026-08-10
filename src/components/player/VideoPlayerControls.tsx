import {
  IconMaximize,
  IconMinimize,
  IconPlayerPause,
  IconPlayerPlay,
  IconPlayerSkipBack,
  IconRewindBackward10,
  IconRewindForward10,
  IconVolume,
  IconVolumeOff,
} from '@tabler/icons-react'
import { AnimatePresence, motion } from 'motion/react'
import React, { useCallback, useEffect, useRef } from 'react'

const formatTime = (time: number) => {
  if (isNaN(time)) return '00:00'
  const m = Math.floor(time / 60)
    .toString()
    .padStart(2, '0')
  const s = Math.floor(time % 60)
    .toString()
    .padStart(2, '0')
  return `${m}:${s}`
}

interface VideoPlayerControlsProps {
  isVisible: boolean
  isPlaying: boolean
  isFullscreen: boolean
  currentTime: number
  duration: number
  volume: number
  isMuted: boolean
  onTogglePlayback: () => void
  onSeekTo: (time: number) => void
  onSeekRelative: (seconds: number) => void
  onToggleMute: () => void
  onSetVolume: (volume: number) => void
  onToggleFullscreen: () => void
  onMouseEnter?: () => void
  onMouseLeave?: () => void
}

export function VideoPlayerControls({
  isVisible,
  isPlaying,
  isFullscreen,
  currentTime,
  duration,
  volume,
  isMuted,
  onTogglePlayback,
  onSeekTo,
  onSeekRelative,
  onToggleMute,
  onSetVolume,
  onToggleFullscreen,
  onMouseEnter,
  onMouseLeave,
}: VideoPlayerControlsProps) {
  const scrubberRef = useRef<HTMLDivElement>(null)
  const isDragging = useRef(false)

  const handleScrub = useCallback(
    (e: MouseEvent | React.MouseEvent, forceSeek = false) => {
      if (!scrubberRef.current || duration === 0) return
      const rect = scrubberRef.current.getBoundingClientRect()
      const x = Math.max(0, Math.min(e.clientX - rect.left, rect.width))
      const percent = x / rect.width
      const targetTime = percent * duration

      if (forceSeek || isDragging.current) {
        onSeekTo(targetTime)
      }
    },
    [duration, onSeekTo],
  )

  useEffect(() => {
    const handleMouseUp = () => (isDragging.current = false)
    const handleMouseMove = (e: MouseEvent) => {
      if (isDragging.current) handleScrub(e)
    }

    window.addEventListener('mouseup', handleMouseUp)
    window.addEventListener('mousemove', handleMouseMove)

    return () => {
      window.removeEventListener('mouseup', handleMouseUp)
      window.removeEventListener('mousemove', handleMouseMove)
    }
  }, [handleScrub])

  const progressPercent = duration > 0 ? (currentTime / duration) * 100 : 0

  return (
    <AnimatePresence>
      {isVisible && (
        <motion.div
          className="VideoPlayerControls"
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: 10 }}
          transition={{ duration: 0.2 }}
          onHoverStart={onMouseEnter}
          onHoverEnd={onMouseLeave}
        >
          {/* Scrubber */}
          <div
            className="VideoPlayerControls__scrubber-container"
            ref={scrubberRef}
            onMouseDown={(e) => {
              isDragging.current = true
              handleScrub(e, true)
            }}
          >
            <div className="VideoPlayerControls__scrubber-track">
              <div
                className="VideoPlayerControls__scrubber-fill"
                style={{ width: `${progressPercent}%` }}
              />
              <div
                className="VideoPlayerControls__scrubber-thumb"
                style={{ left: `${progressPercent}%` }}
              />
            </div>
          </div>

          <div className="VideoPlayerControls__bottom">
            <div className="VideoPlayerControls__group">
              <button className="icon-btn" onClick={onTogglePlayback}>
                {isPlaying ? (
                  <IconPlayerPause size={24} />
                ) : (
                  <IconPlayerPlay size={24} />
                )}
              </button>

              <button className="icon-btn" onClick={() => onSeekTo(0)}>
                <IconPlayerSkipBack size={20} />
              </button>
              <button className="icon-btn" onClick={() => onSeekRelative(-10)}>
                <IconRewindBackward10 size={20} />
              </button>
              <button className="icon-btn" onClick={() => onSeekRelative(10)}>
                <IconRewindForward10 size={20} />
              </button>

              <div className="VideoPlayerControls__volume-group">
                <button className="icon-btn" onClick={onToggleMute}>
                  {isMuted || volume === 0 ? (
                    <IconVolumeOff size={20} />
                  ) : (
                    <IconVolume size={20} />
                  )}
                </button>
                <input
                  type="range"
                  className="VideoPlayerControls__volume-slider"
                  min="0"
                  max="1"
                  step="0.05"
                  value={isMuted ? 0 : volume}
                  onChange={(e) => onSetVolume(parseFloat(e.target.value))}
                />
              </div>

              <div className="VideoPlayerControls__time">
                {formatTime(currentTime)} / {formatTime(duration)}
              </div>
            </div>

            <div className="VideoPlayerControls__group">
              <button className="icon-btn" onClick={onToggleFullscreen}>
                {isFullscreen ? (
                  <IconMinimize size={20} />
                ) : (
                  <IconMaximize size={20} />
                )}
              </button>
            </div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}
