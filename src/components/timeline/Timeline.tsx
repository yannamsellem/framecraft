import { IconZoomIn, IconZoomOut, IconZoomReset } from '@tabler/icons-react'
import { motion, useAnimationFrame, useMotionValue } from 'motion/react'
import { useEffect, useMemo, useRef, useState } from 'react'
import { useEditorStore } from '../../store/useEditorStore'
import { useTimelineStore } from '../../store/useTimelineStore'
import './Timeline.css'
import { TimelineTrack } from './TimelineTrack'

export function Timeline() {
  const { duration, currentTime, isPlaying } = useEditorStore()
  const [pxPerSec, setPxPerSec] = useState(100)

  const handleZoomIn = () => setPxPerSec((prev) => Math.min(prev * 1.5, 1000))
  const handleZoomOut = () => setPxPerSec((prev) => Math.max(prev / 1.5, 5))
  const handleZoomReset = () => setPxPerSec(100)

  const markerStep = useMemo(() => {
    if (pxPerSec < 10) return 60
    if (pxPerSec < 20) return 30
    if (pxPerSec < 50) return 10
    if (pxPerSec < 100) return 5
    return 1
  }, [pxPerSec])

  const markers = useMemo(() => {
    const arr = []
    for (let i = 0; i <= Math.floor(duration); i += markerStep) {
      arr.push(i)
    }
    return arr
  }, [duration, markerStep])

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
        
        <div className="Timeline__controls">
          <button 
            className="Timeline__icon-btn" 
            onClick={handleZoomOut} 
            disabled={pxPerSec <= 5}
            title="Zoom Out"
          >
            <IconZoomOut size={16} />
          </button>
          <button 
            className="Timeline__icon-btn" 
            onClick={handleZoomReset} 
            disabled={pxPerSec === 100}
            title="Reset Zoom"
          >
            <IconZoomReset size={16} />
          </button>
          <button 
            className="Timeline__icon-btn" 
            onClick={handleZoomIn} 
            disabled={pxPerSec >= 1000}
            title="Zoom In"
          >
            <IconZoomIn size={16} />
          </button>
          <span className="Timeline__time">
            {currentTime.toFixed(2)}s / {duration.toFixed(2)}s
          </span>
        </div>
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
