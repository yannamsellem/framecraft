/// <reference lib="webworker" />
import type { ChunkPayload } from '../core/types'

export type RenderInputEvent =
  | { type: 'INIT'; canvas: OffscreenCanvas }
  | { type: 'CONFIGURE'; config: VideoDecoderConfig }
  | { type: 'CHUNK'; payload: ChunkPayload }
  | { type: 'SYNC'; time: number }
  | { type: 'FLUSH' }
  | { type: 'RESET'; time?: number }

let canvas: OffscreenCanvas | null = null
let ctx: OffscreenCanvasRenderingContext2D | null = null
let decoder: VideoDecoder | null = null

let masterChunkQueue: ChunkPayload[] = []
let chunkQueue: ChunkPayload[] = []
let pendingFrames: VideoFrame[] = []
let lastDrawnTime = -1

let currentConfig: VideoDecoderConfig | null = null

let seekTargetTimeInSeconds: number | undefined = undefined

self.onmessage = async (e: MessageEvent<RenderInputEvent>) => {
  const data = e.data

  switch (data.type) {
    case 'INIT':
      canvas = data.canvas
      ctx = canvas.getContext('2d')
      initDecoder()
      break

    case 'CONFIGURE':
      if (decoder && decoder.state === 'configured') {
        decoder.reset()
      }
      masterChunkQueue = []
      chunkQueue = []
      pendingFrames.forEach((f) => f.close())
      pendingFrames = []
      currentConfig = data.config
      decoder?.configure(currentConfig)
      break

    case 'CHUNK':
      masterChunkQueue.push(data.payload)
      chunkQueue.push(data.payload)
      processQueue()
      break

    case 'SYNC':
      seekTargetTimeInSeconds = undefined
      syncFrame(data.time)
      processQueue()
      break

    case 'FLUSH':
      if (decoder && decoder.state === 'configured') {
        await decoder.flush()
      }
      break

    case 'RESET':
      if (decoder && decoder.state !== 'closed') {
        decoder.reset()
        if (currentConfig) {
          decoder.configure(currentConfig)
        }
      }

      pendingFrames.forEach((f) => f.close())
      pendingFrames = []
      lastDrawnTime = -1
      seekTargetTimeInSeconds = data.time

      if (data.time !== undefined) {
        const targetMicros = data.time * 1_000_000
        // Find nearest keyframe before or exactly at target time
        let startIdx = 0
        for (let i = 0; i < masterChunkQueue.length; i++) {
          const chunk = masterChunkQueue[i]
          if (chunk.type === 'key' && chunk.timestamp <= targetMicros) {
            startIdx = i
          } else if (chunk.timestamp > targetMicros) {
            break
          }
        }
        chunkQueue = masterChunkQueue.slice(startIdx)
      } else {
        chunkQueue = []
      }

      processQueue()
      break
  }
}

function processQueue() {
  if (decoder?.state !== 'configured') return

  while (
    chunkQueue.length > 0 &&
    pendingFrames.length < 5 &&
    decoder.decodeQueueSize < 5
  ) {
    const payload = chunkQueue.shift()!
    const chunk = new EncodedVideoChunk({
      type: payload.type,
      timestamp: payload.timestamp,
      duration: payload.duration,
      data: new Uint8Array(payload.data),
    })
    decoder.decode(chunk)
  }
}

function syncFrame(timeInSeconds: number) {
  if (!ctx || !canvas || pendingFrames.length === 0) return

  const targetTimeMicros = timeInSeconds * 1_000_000

  let bestFrameIndex = -1
  for (let i = 0; i < pendingFrames.length; i++) {
    if (pendingFrames[i].timestamp <= targetTimeMicros) {
      bestFrameIndex = i
    } else {
      break
    }
  }

  if (
    bestFrameIndex === -1 &&
    pendingFrames.length > 0 &&
    lastDrawnTime === -1
  ) {
    bestFrameIndex = 0
  }

  if (bestFrameIndex !== -1) {
    const frame = pendingFrames[bestFrameIndex]

    if (
      canvas.width !== frame.displayWidth ||
      canvas.height !== frame.displayHeight
    ) {
      canvas.width = frame.displayWidth
      canvas.height = frame.displayHeight
    }

    ctx.drawImage(frame, 0, 0, canvas.width, canvas.height)
    lastDrawnTime = frame.timestamp

    for (let i = 0; i <= bestFrameIndex; i++) {
      pendingFrames[i].close()
    }
    pendingFrames.splice(0, bestFrameIndex + 1)
  }
}

function initDecoder() {
  decoder = new VideoDecoder({
    output: (frame: VideoFrame) => {
      pendingFrames.push(frame)
      pendingFrames.sort((a, b) => a.timestamp - b.timestamp)

      if (typeof seekTargetTimeInSeconds === 'number') {
        syncFrame(seekTargetTimeInSeconds)
      }

      processQueue()
    },
    error: (e: Error) => console.error('VideoDecoder error:', e),
  })
}
