import { useRef, useState } from 'react'
import { useTimelineStore } from '../../store/useTimelineStore'
import { useEditorStore } from '../../store/useEditorStore'
import { TimelineBlockView } from './TimelineBlock'
import { snapToKeyframe } from '../../utils/timeline'

interface Props {
  pxPerSec: number
  duration: number
}

export function TimelineTrack({ pxPerSec, duration }: Props) {
  const { blocks, addOrUpdateBlock, setActiveBlock } = useTimelineStore()
  const { metadata } = useEditorStore()
  const trackRef = useRef<HTMLDivElement>(null)

  const [isDrawing, setIsDrawing] = useState(false)
  const [drawStart, setDrawStart] = useState(0) // time
  const [drawEnd, setDrawEnd] = useState(0) // time

  const getTimeFromEvent = (e: React.PointerEvent) => {
    if (!trackRef.current) return 0
    const rect = trackRef.current.getBoundingClientRect()
    const x = e.clientX - rect.left
    return Math.max(0, Math.min(duration, x / pxPerSec))
  }

  const handlePointerDown = (e: React.PointerEvent) => {
    if ((e.target as HTMLElement).classList.contains('TimelineTrack')) {
      const time = getTimeFromEvent(e)
      const snappedTime = snapToKeyframe(time, metadata?.keyframes)
      setDrawStart(snappedTime)
      setDrawEnd(snappedTime)
      setIsDrawing(true)
      setActiveBlock(null)
      e.currentTarget.setPointerCapture(e.pointerId)
    }
  }

  const handlePointerMove = (e: React.PointerEvent) => {
    if (isDrawing) {
      const time = getTimeFromEvent(e)
      setDrawEnd(snapToKeyframe(time, metadata?.keyframes))
    }
  }

  const handlePointerUp = (e: React.PointerEvent) => {
    if (isDrawing) {
      setIsDrawing(false)
      e.currentTarget.releasePointerCapture(e.pointerId)

      const start = Math.min(drawStart, drawEnd)
      const end = Math.max(drawStart, drawEnd)

      if (end - start > 0.1) {
        addOrUpdateBlock(start, end)
      }
    }
  }

  return (
    <div
      className="TimelineTrack"
      ref={trackRef}
      onPointerDown={handlePointerDown}
      onPointerMove={handlePointerMove}
      onPointerUp={handlePointerUp}
      onPointerCancel={handlePointerUp}
      style={{ width: duration * pxPerSec }}
    >
      {metadata?.keyframes.map((kf) => (
        <div
          key={kf}
          className="TimelineTrack__keyframe"
          style={{ left: kf * pxPerSec }}
        />
      ))}

      {blocks.map((block) => (
        <TimelineBlockView key={block.id} block={block} pxPerSec={pxPerSec} />
      ))}

      {isDrawing && (
        <div
          className="TimelineTrack__drawing"
          style={{
            left: Math.min(drawStart, drawEnd) * pxPerSec,
            width: Math.abs(drawEnd - drawStart) * pxPerSec,
          }}
        />
      )}
    </div>
  )
}
