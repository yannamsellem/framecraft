import { create } from 'zustand'
import { combine } from 'zustand/middleware'

export interface TimelineBlock {
  id: string
  start: number // in seconds
  end: number // in seconds
}

interface State {
  blocks: TimelineBlock[]
  activeBlockId: string | null
}

interface Actions {
  addOrUpdateBlock: (start: number, end: number, id?: string) => void
  deleteBlock: (id: string) => void
  setActiveBlock: (id: string | null) => void
}

export type TimelineState = State & Actions

// Helper function to merge overlapping blocks
function mergeBlocks(blocks: TimelineBlock[]): TimelineBlock[] {
  if (blocks.length === 0) return []

  // Sort blocks by start time
  const sorted = [...blocks].sort((a, b) => a.start - b.start)
  const merged: TimelineBlock[] = [sorted[0]]

  for (let i = 1; i < sorted.length; i++) {
    const current = sorted[i]
    const last = merged[merged.length - 1]

    // If current block overlaps with the last block in merged array
    if (current.start <= last.end) {
      // Merge them by extending the end time
      last.end = Math.max(last.end, current.end)
    } else {
      // No overlap, just push
      merged.push(current)
    }
  }

  return merged
}

export const useTimelineStore = create<TimelineState>(
  combine<State, Actions>(
    {
      blocks: [],
      activeBlockId: null,
    },
    (set, get) => ({
      addOrUpdateBlock: (start, end, id) => {
        // Enforce valid start/end bounds
        const safeStart = Math.min(start, end)
        const safeEnd = Math.max(start, end)
        
        // Prevent zero-width blocks from breaking things (minimum 100ms)
        const minDuration = 0.1
        const finalEnd = safeEnd - safeStart < minDuration ? safeStart + minDuration : safeEnd

        const newBlock = {
          id: id || crypto.randomUUID(),
          start: safeStart,
          end: finalEnd,
        }

        const currentBlocks = get().blocks
        // Filter out the one we're updating
        const otherBlocks = currentBlocks.filter((b) => b.id !== newBlock.id)

        const merged = mergeBlocks([...otherBlocks, newBlock])
        
        // If the active block was merged out of existence (id no longer exists),
        // we might want to clear it, but let's just make sure activeBlockId is still valid.
        const currentActive = get().activeBlockId
        const activeStillExists = merged.some((b) => b.id === currentActive)
        
        set({
          blocks: merged,
          activeBlockId: activeStillExists ? currentActive : null
        })
      },
      deleteBlock: (id) => {
        const blocks = get().blocks.filter((b) => b.id !== id)
        const activeBlockId = get().activeBlockId === id ? null : get().activeBlockId
        set({ blocks, activeBlockId })
      },
      setActiveBlock: (id) => set({ activeBlockId: id }),
    }),
  ),
)
