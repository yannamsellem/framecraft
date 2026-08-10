import { create } from 'zustand'
import { combine } from 'zustand/middleware'
import type { MetadataPayload } from '../core/types'

interface State {
  file: File | null
  metadata: MetadataPayload | null
  isLoading: boolean
  isPlaying: boolean
  currentTime: number // in seconds
  duration: number // in seconds
  volume: number // 0 to 1
  isMuted: boolean
}

interface Actions {
  setFile: (file: File) => void
  setMetadata: (metadata: MetadataPayload) => void
  setIsPlaying: (isPlaying: boolean) => void
  setCurrentTime: (time: number) => void
  setVolume: (volume: number) => void
  setIsMuted: (isMuted: boolean) => void
}

export type EditorState = State & Actions

export const useEditorStore = create<EditorState>(
  combine<State, Actions>(
    {
      file: null,
      metadata: null,
      isLoading: false,
      isPlaying: false,
      currentTime: 0,
      duration: 0,
      volume: 1,
      isMuted: false,
    },
    (set) => ({
      setFile: (file) =>
        set({
          file,
          metadata: null,
          isLoading: true,
          currentTime: 0,
          duration: 0,
          isPlaying: false,
        }),
      setMetadata: (metadata) =>
        set({ metadata, duration: metadata.duration, isLoading: false }),
      setIsPlaying: (isPlaying) => set({ isPlaying }),
      setCurrentTime: (currentTime) => set({ currentTime }),
      setVolume: (volume) => set({ volume }),
      setIsMuted: (isMuted) => set({ isMuted }),
    }),
  ),
)
