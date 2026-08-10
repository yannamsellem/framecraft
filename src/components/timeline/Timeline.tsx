import { motion, useAnimationFrame, useMotionValue } from 'motion/react'
import { useEffect, useMemo, useRef } from 'react'
import { useEditorStore } from '../../store/useEditorStore'
import { useTimelineStore } from '../../store/useTimelineStore'
import './Timeline.css'
import { TimelineTrack } from './TimelineTrack'

export function Timeline() {
  const { duration, currentTime, isPlaying } = useEditorStore()
  const pxPerSec = 100 // Scale: 100 pixels per second
  const markers = useMemo(
    () => Array.from({ length: Math.floor(duration) + 1 }, (_, i) => i),
    [duration],
  )
  const scrollRef = useRef<HTMLDivElement>(null)
  const cursorX = useMotionValue(0)

  const { activeBlockId, deleteBlock, setActiveBlock } = useTimelineStore()

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (
        e.target instanceof HTMLInputElement ||
        e.target instanceof HTMLTextAreaElement
      ) {
        return
      }

      if (e.key === 'Backspace' || e.key === 'Delete') {
        if (activeBlockId) {
          deleteBlock(activeBlockId)
          setActiveBlock(null)
        }
      }
    }

    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [activeBlockId, deleteBlock, setActiveBlock])

  useAnimationFrame(() => {
    if (isPlaying && scrollRef.current) {
      const container = scrollRef.current
      const playheadX = currentTime * pxPerSec
      cursorX.set(playheadX)
      container.scrollLeft = playheadX - container.clientWidth * 0.5
    }
  })

  useEffect(() => {
    if (isPlaying || !scrollRef.current) return

    const container = scrollRef.current
    const playheadX = currentTime * pxPerSec
    cursorX.set(playheadX)
    container.scrollLeft = playheadX - container.clientWidth * 0.5
  }, [currentTime, pxPerSec, isPlaying, cursorX])

  return (
    <div className="Timeline">
      <div className="Timeline__header">
        <span className="Timeline__title">Timeline</span>
        <span className="Timeline__time">
          {currentTime.toFixed(2)}s / {duration.toFixed(2)}s
        </span>
      </div>

      <div className="Timeline__scroll-container" ref={scrollRef}>
        <div
          className="Timeline__content"
          style={{ width: duration * pxPerSec }}
        >
          <div className="Timeline__ruler">
            {markers.map((i) => (
              <div
                key={i}
                className="Timeline__marker"
                style={{ left: i * pxPerSec }}
              >
                <div className="Timeline__marker-tick"></div>
                <div className="Timeline__marker-time">{i}s</div>
              </div>
            ))}
          </div>

          <TimelineTrack pxPerSec={pxPerSec} duration={duration} />

          <motion.div className="Timeline__playhead" style={{ x: cursorX }}>
            <div className="Timeline__playhead-head"></div>
            <div className="Timeline__playhead-line"></div>
          </motion.div>
        </div>
      </div>
    </div>
  )
}
