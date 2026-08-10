import { useEffect, useCallback, useRef } from 'react'
import { PlayerController } from '../core/PlayerController'
import { useEditorStore } from '../store/useEditorStore'
import { useTimelineStore } from '../store/useTimelineStore'

export const usePlayer = () => {
  const {
    file,
    isPlaying,
    volume,
    isMuted,
    setMetadata,
    setIsPlaying,
    setCurrentTime,
    setVolume,
    setIsMuted,
  } = useEditorStore()
  const controllerRef = useRef<PlayerController | null>(null)

  const attachCanvas = useCallback<React.RefCallback<HTMLCanvasElement>>(
    (node) => {
      if (!node) return

      if (!controllerRef.current) {
        controllerRef.current = new PlayerController()
        controllerRef.current.attachCanvas(node)
      }

      controllerRef.current.onMetadata((metadata) => setMetadata(metadata))
      controllerRef.current.onTimeUpdate((time) => setCurrentTime(time))
      controllerRef.current.onPlaybackEnd(() => setIsPlaying(false))

      return () => {
        // small hack to handle React's StrictMode,
        // which triggers the `useEffect` function twice in development
        if (!node.isConnected) {
          controllerRef.current?.destroy()
          controllerRef.current = null
        }
      }
    },
    [setMetadata, setCurrentTime, setIsPlaying],
  )

  // Handle file loading
  useEffect(() => {
    if (!file) return
    if (!controllerRef.current) return

    controllerRef.current
      .load(file)
      .catch((e) => console.error('usePlayer: Failed to load file', e))
  }, [file])

  // Sync volume
  useEffect(() => controllerRef.current?.setVolume(volume), [volume])

  // Sync muted state
  useEffect(() => controllerRef.current?.setMuted(isMuted), [isMuted])

  // Sync timeline state with controller
  const { blocks, activeBlockId } = useTimelineStore()
  useEffect(
    () => controllerRef.current?.setTimelineState(blocks, activeBlockId),
    [blocks, activeBlockId],
  )

  const togglePlayback = useCallback(() => {
    const currentState = useEditorStore.getState()
    const { blocks } = useTimelineStore.getState()

    const endTime =
      blocks.length > 0 ? blocks[blocks.length - 1].end : currentState.duration
    const atEnd = endTime > 0 && currentState.currentTime >= endTime

    if (isPlaying) {
      controllerRef.current?.pause()
    } else {
      if (atEnd) {
        const start = blocks.length > 0 ? blocks[0].start : 0
        controllerRef.current?.seek(start)
        controllerRef.current?.play(start)
      } else {
        controllerRef.current?.play(currentState.currentTime)
      }
    }
    setIsPlaying(!isPlaying)
  }, [isPlaying, setIsPlaying])

  const seekTo = useCallback(
    (time: number) => controllerRef.current?.seek(time),
    [],
  )

  const seekRelative = useCallback((seconds: number) => {
    const storeState = useEditorStore.getState()
    const newTime = Math.max(
      0,
      Math.min(storeState.duration, storeState.currentTime + seconds),
    )
    controllerRef.current?.seek(newTime)
  }, [])

  const toggleMute = useCallback(() => {
    const currentState = useEditorStore.getState().isMuted
    setIsMuted(!currentState)
  }, [setIsMuted])

  return {
    attachCanvas,
    togglePlayback,
    seekTo,
    seekRelative,
    toggleMute,
    setVolume,
  }
}
