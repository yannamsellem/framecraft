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
