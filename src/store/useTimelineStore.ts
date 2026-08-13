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
  resetTimeline: () => void
}

export type TimelineState = State & Actions

function mergeBlocks(blocks: TimelineBlock[]): TimelineBlock[] {
  if (blocks.length === 0) return []

  const sorted = blocks.toSorted((a, b) => a.start - b.start)
  const merged: TimelineBlock[] = [sorted[0]]

  let i = 0
  while (i < sorted.length) {
    const current = sorted[i]
    const last = merged[merged.length - 1]

    if (current.start <= last.end) last.end = Math.max(last.end, current.end)
    else merged.push(current)

    i += 1
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
        const safeStart = Math.min(start, end)
        const safeEnd = Math.max(start, end)

        const minDuration = 0.1
        const finalEnd =
          safeEnd - safeStart < minDuration ? safeStart + minDuration : safeEnd

        const newBlock = {
          id: id || crypto.randomUUID(),
          start: safeStart,
          end: finalEnd,
        }

        const currentBlocks = get().blocks
        const otherBlocks = currentBlocks.filter((b) => b.id !== newBlock.id)
        const merged = mergeBlocks(otherBlocks.concat(newBlock))

        const currentActive = get().activeBlockId
        const activeStillExists = merged.some((b) => b.id === currentActive)

        set({
          blocks: merged,
          activeBlockId: activeStillExists ? currentActive : null,
        })
      },
      deleteBlock: (id) => {
        const blocks = get().blocks.filter((b) => b.id !== id)
        const activeBlockId =
          get().activeBlockId === id ? null : get().activeBlockId
        set({ blocks, activeBlockId })
      },
      setActiveBlock: (id) => set({ activeBlockId: id }),
      resetTimeline: () => set({ blocks: [], activeBlockId: null }),
    }),
  ),
)
