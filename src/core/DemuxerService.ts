import { WebDemuxer } from 'web-demuxer'
import type { DemuxerType, MetadataPayload, ChunkPayload } from './types'

export class DemuxerService {
  private demuxer: WebDemuxer | null = null
  private hasAudioTrack = false

  private videoChunkCallback: ((chunk: ChunkPayload) => void) | null = null
  private audioChunkCallback: ((chunk: ChunkPayload) => void) | null = null
  private onCompleteCallback: (() => void) | null = null

  public onVideoChunk(callback: (chunk: ChunkPayload) => void) {
    this.videoChunkCallback = callback
  }

  public onAudioChunk(callback: (chunk: ChunkPayload) => void) {
    this.audioChunkCallback = callback
  }

  public onComplete(callback: () => void) {
    this.onCompleteCallback = callback
  }

  public async getMetadata(file: File): Promise<MetadataPayload> {
    this.demuxer = new WebDemuxer({
      wasmFilePath: window.location.origin + '/web-demuxer.wasm',
    })
    await this.demuxer.load(file)

    const mediaInfo = await this.demuxer.getMediaInfo()
    const videoTrack = mediaInfo.streams.find(
      (s) => s.codec_type_string === 'video',
    )
    const audioTrack = mediaInfo.streams.find(
      (s) => s.codec_type_string === 'audio',
    )

    if (!videoTrack) {
      throw new Error('No video track found in the file.')
    }

    this.hasAudioTrack = !!audioTrack

    let fps = 30
    if (videoTrack.avg_frame_rate && videoTrack.avg_frame_rate.includes('/')) {
      const [num, den] = videoTrack.avg_frame_rate.split('/')
      if (num && den && parseInt(den) > 0) {
        fps = Math.floor(parseInt(num) / parseInt(den))
      }
    }

    const keyframes: number[] = []
    const stream = this.demuxer.readMediaPacket('video')
    const reader = stream.getReader()

    while (true) {
      const { done, value } = await reader.read()
      if (done) break

      if (value && value.keyframe === 1) {
        keyframes.push(value.timestamp)
      }
    }

    const videoConfig = await this.demuxer.getDecoderConfig('video')
    let audioConfig: AudioDecoderConfig | undefined
    if (this.hasAudioTrack) {
      try {
        audioConfig = await this.demuxer.getDecoderConfig('audio')
      } catch (e) {
        console.warn('Failed to generate audio decoder config:', e)
        this.hasAudioTrack = false
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

  public async startDemuxing() {
    if (!this.demuxer) return

    const streamVideo = async () => {
      if (!this.demuxer) return
      const stream = this.demuxer.readMediaPacket('video', 0)
      const reader = stream.getReader()

      while (true) {
        const { done, value } = await reader.read()
        if (done) break

        if (value) {
          const payload: ChunkPayload = {
            type: value.keyframe === 1 ? 'key' : 'delta',
            timestamp: Math.round(value.timestamp * 1_000_000), // convert to microseconds
            duration: Math.round((value.duration || 0) * 1_000_000), // convert to microseconds
            data: value.data.buffer.slice(
              value.data.byteOffset,
              value.data.byteOffset + value.data.byteLength,
            ) as ArrayBuffer,
          }
          this.videoChunkCallback?.(payload)
        }
      }
    }

    const streamAudio = async () => {
      if (!this.demuxer) return
      const stream = this.demuxer.readMediaPacket('audio', 0)
      const reader = stream.getReader()

      while (true) {
        const { done, value } = await reader.read()
        if (done) break

        if (value) {
          const payload: ChunkPayload = {
            type: value.keyframe === 1 ? 'key' : 'delta',
            timestamp: Math.round(value.timestamp * 1_000_000), // convert to microseconds
            duration: Math.round((value.duration || 0) * 1_000_000), // convert to microseconds
            data: value.data.buffer.slice(
              value.data.byteOffset,
              value.data.byteOffset + value.data.byteLength,
            ) as ArrayBuffer,
          }
          this.audioChunkCallback?.(payload)
        }
      }
    }

    try {
      await streamVideo()
      if (this.hasAudioTrack) await streamAudio()

      this.onCompleteCallback?.()
    } catch (err) {
      console.error('Demuxing failed', err)
    }
  }

  public terminate() {
    if (this.demuxer) {
      this.demuxer.destroy()
      this.demuxer = null
    }
  }
}
