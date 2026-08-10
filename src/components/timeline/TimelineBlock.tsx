import { motion } from 'motion/react'
import { useEffect, useState } from 'react'
import {
  useTimelineStore,
  type TimelineBlock,
} from '../../store/useTimelineStore'

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
      if (interaction === 'left') {
        addOrUpdateBlock(block.start + timeDelta, block.end, block.id)
      } else if (interaction === 'right') {
        addOrUpdateBlock(block.start, block.end + timeDelta, block.id)
      } else if (interaction === 'center') {
        addOrUpdateBlock(
          block.start + timeDelta,
          block.end + timeDelta,
          block.id,
        )
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
      className={`TimelineBlock ${isActive ? 'TimelineBlock--active' : ''}`}
      style={{
        left: finalLeft,
        width: Math.max(10, finalWidth),
      }}
      onPointerDown={(e) => {
        e.stopPropagation()
        // Prevent setting active if we are clicking a resize handle
        if (
          (e.target as HTMLElement).classList.contains('TimelineBlock__handle')
        )
          return
        setInteraction('center')
        if (isActive) {
          setActiveBlock(null)
        } else {
          setActiveBlock(block.id)
        }
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
