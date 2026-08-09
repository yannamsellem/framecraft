import { WebDemuxer } from 'web-demuxer'

export type DemuxerType = 'isobmff' | 'ebml' | 'unknown'

export interface MetadataPayload {
  type: DemuxerType
  duration: number // in seconds
  fps: number
  width: number
  height: number
  codec: string
  keyframes: number[] // timestamps in seconds
  videoConfig: VideoDecoderConfig
  audioConfig?: AudioDecoderConfig
}

export type ChunkPayload = {
  type: 'key' | 'delta'
  timestamp: number // in microseconds
  duration: number // in microseconds
  data: ArrayBuffer
}

export type MessageInputEvent =
  { type: 'LOAD_FILE'; file: File } | { type: 'START_DEMUXING' }

export type MessageOutputEvent =
  | { type: 'METADATA_READY'; payload: MetadataPayload }
  | { type: 'VIDEO_CHUNK'; payload: ChunkPayload }
  | { type: 'AUDIO_CHUNK'; payload: ChunkPayload }
  | { type: 'DEMUX_COMPLETE' }
  | { type: 'ERROR'; error: string }

let demuxerInstance: WebDemuxer | null = null
let hasAudioTrack = false

self.onmessage = async (e: MessageEvent<MessageInputEvent>) => {
  const { type } = e.data

  try {
    if (type === 'LOAD_FILE') {
      const metadata = await loadAndDemuxFile(e.data.file)
      self.postMessage({ type: 'METADATA_READY', payload: metadata })
    } else if (type === 'START_DEMUXING') {
      if (!demuxerInstance) throw new Error('Demuxer not loaded')
      await startDemuxing(demuxerInstance)
    }
  } catch (err) {
    self.postMessage({
      type: 'ERROR',
      error: err instanceof Error ? err.message : String(err),
    })
  }
}

async function loadAndDemuxFile(file: File): Promise<MetadataPayload> {
  demuxerInstance = new WebDemuxer({
    wasmFilePath: self.location.origin + '/web-demuxer.wasm',
  })
  await demuxerInstance.load(file)

  const mediaInfo = await demuxerInstance.getMediaInfo()
  const videoTrack = mediaInfo.streams.find(
    (s) => s.codec_type_string === 'video',
  )
  const audioTrack = mediaInfo.streams.find(
    (s) => s.codec_type_string === 'audio',
  )

  if (!videoTrack) {
    throw new Error('No video track found in the file.')
  }

  hasAudioTrack = !!audioTrack

  let fps = 30
  if (videoTrack.avg_frame_rate && videoTrack.avg_frame_rate.includes('/')) {
    const [num, den] = videoTrack.avg_frame_rate.split('/')
    if (num && den && parseInt(den) > 0) {
      fps = Math.floor(parseInt(num) / parseInt(den))
    }
  }

  const keyframes: number[] = []
  const stream = demuxerInstance.readMediaPacket('video')
  const reader = stream.getReader()

  while (true) {
    const { done, value } = await reader.read()
    if (done) break

    if (value && value.keyframe === 1) {
      keyframes.push(value.timestamp)
    }
  }

  // Use web-demuxer built-in config generator
  const videoConfig = await demuxerInstance.getDecoderConfig('video')
  let audioConfig: AudioDecoderConfig | undefined
  if (hasAudioTrack) {
    try {
      audioConfig = await demuxerInstance.getDecoderConfig('audio')
    } catch (e) {
      console.warn('Failed to generate audio decoder config:', e)
      hasAudioTrack = false
    }
  }

  let containerType: DemuxerType = 'unknown'
  if (
    mediaInfo.format_name?.includes('mp4') ||
    mediaInfo.format_name?.includes('mov')
  ) {
    containerType = 'isobmff'
  } else if (
    mediaInfo.format_name?.includes('webm') ||
    mediaInfo.format_name?.includes('matroska')
  ) {
    containerType = 'ebml'
  }

  return {
    type: containerType,
    duration: videoTrack.duration || mediaInfo.duration || 0,
    fps,
    width: videoTrack.width || 0,
    height: videoTrack.height || 0,
    codec: videoTrack.codec_name || 'unknown',
    keyframes,
    videoConfig,
    audioConfig,
  }
}

async function startDemuxing(demuxer: WebDemuxer) {
  await streamVideo(demuxer)
  if (hasAudioTrack) {
    await streamAudio(demuxer)
  }

  self.postMessage({ type: 'DEMUX_COMPLETE' })
}

async function streamVideo(demuxer: WebDemuxer) {
  const stream = demuxer.readMediaPacket('video', 0)
  const reader = stream.getReader()

  while (true) {
    const { done, value } = await reader.read()
    if (done) break

    if (value) {
      const dataCopy = new Uint8Array(value.data).buffer
      const payload: ChunkPayload = {
        type: value.keyframe === 1 ? 'key' : 'delta',
        timestamp: Math.round(value.timestamp * 1_000_000), // convert to microseconds
        duration: Math.round((value.duration || 0) * 1_000_000), // convert to microseconds
        data: dataCopy,
      }

      self.postMessage({ type: 'VIDEO_CHUNK', payload }, [dataCopy])
    }
  }
}

async function streamAudio(demuxer: WebDemuxer) {
  const stream = demuxer.readMediaPacket('audio', 0)
  const reader = stream.getReader()

  while (true) {
    const { done, value } = await reader.read()
    if (done) break

    if (value) {
      const dataCopy = new Uint8Array(value.data).buffer
      const payload: ChunkPayload = {
        type: value.keyframe === 1 ? 'key' : 'delta',
        timestamp: Math.round(value.timestamp * 1_000_000), // convert to microseconds
        duration: Math.round((value.duration || 0) * 1_000_000), // convert to microseconds
        data: dataCopy,
      }

      self.postMessage({ type: 'AUDIO_CHUNK', payload }, [dataCopy])
    }
  }
}
