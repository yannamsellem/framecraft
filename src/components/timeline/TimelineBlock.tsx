import cx from 'classnames'
import { motion } from 'motion/react'
import { useEffect, useState } from 'react'
import { useEditorStore } from '../../store/useEditorStore'
import {
  useTimelineStore,
  type TimelineBlock,
} from '../../store/useTimelineStore'
import { snapToKeyframe } from '../../utils/timeline'

interface Props {
  block: TimelineBlock
  pxPerSec: number
}

export function TimelineBlockView({ block, pxPerSec }: Props) {
  const { addOrUpdateBlock, activeBlockId, setActiveBlock } = useTimelineStore()
  const isActive = activeBlockId === block.id

  const leftPx = block.start * pxPerSec
  const widthPx = (block.end - block.start) * pxPerSec

  const [interaction, setInteraction] = useState<
    false | 'left' | 'right' | 'center'
  >(false)
  const [deltaX, setDeltaX] = useState(0)

  // Drag & Resizing logic
  useEffect(() => {
    if (!interaction) return

    const handlePointerMove = (e: PointerEvent) => {
      setDeltaX((prev) => prev + e.movementX)
    }

    const handlePointerUp = () => {
      const timeDelta = deltaX / pxPerSec
      const keyframes = useEditorStore.getState().metadata?.keyframes

      if (interaction === 'left') {
        const newStart = snapToKeyframe(block.start + timeDelta, keyframes)
        addOrUpdateBlock(newStart, block.end, block.id)
      } else if (interaction === 'right') {
        const newEnd = snapToKeyframe(block.end + timeDelta, keyframes)
        addOrUpdateBlock(block.start, newEnd, block.id)
      } else if (interaction === 'center') {
        const duration = block.end - block.start
        const newStart = snapToKeyframe(block.start + timeDelta, keyframes)
        addOrUpdateBlock(newStart, newStart + duration, block.id)
      }
      setInteraction(false)
      setDeltaX(0)
    }

    window.addEventListener('pointermove', handlePointerMove)
    window.addEventListener('pointerup', handlePointerUp)

    return () => {
      window.removeEventListener('pointermove', handlePointerMove)
      window.removeEventListener('pointerup', handlePointerUp)
    }
  }, [interaction, deltaX, pxPerSec, block, addOrUpdateBlock])

  // Visual offsets while dragging/resizing
  let finalLeft = leftPx
  let finalWidth = widthPx

  if (interaction === 'left') {
    finalLeft += deltaX
    finalWidth -= deltaX
  } else if (interaction === 'right') {
    finalWidth += deltaX
  } else if (interaction === 'center') {
    finalLeft += deltaX
  }

  return (
    <motion.div
      className={cx('TimelineBlock', { 'TimelineBlock--active': isActive })}
      style={{
        left: finalLeft,
        width: Math.max(10, finalWidth),
      }}
      onPointerDown={(e) => {
        e.stopPropagation()
        if (
          (e.target as HTMLElement).classList.contains('TimelineBlock__handle')
        )
          return

        setInteraction('center')
        setActiveBlock(isActive ? null : block.id)
      }}
    >
      <div
        className="TimelineBlock__handle TimelineBlock__handle--left"
        onPointerDown={() => setInteraction('left')}
      />

      <div className="TimelineBlock__content">
        {/* We can show some info here later, like duration */}
      </div>

      <div
        className="TimelineBlock__handle TimelineBlock__handle--right"
        onPointerDown={() => setInteraction('right')}
      />
    </motion.div>
  )
}
