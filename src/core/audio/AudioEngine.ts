import type { ChunkPayload } from '../types'

export class AudioEngine {
  private decoder: AudioDecoder | null = null
  private sampleRate = 48000
  private numberOfChannels = 2
  private audioChannels: Float32Array[][] = []

  public configure(config: AudioDecoderConfig) {
    this.audioChannels = []

    if (this.decoder && this.decoder.state !== 'closed') {
      this.decoder.close()
    }

    this.decoder = new AudioDecoder({
      output: (data: AudioData) => {
        if (this.audioChannels.length === 0) {
          this.sampleRate = data.sampleRate
          this.numberOfChannels = data.numberOfChannels
          for (let i = 0; i < this.numberOfChannels; i++) {
            this.audioChannels.push([])
          }
        }

        const format = 'f32-planar'
        for (let c = 0; c < this.numberOfChannels; c++) {
          const buffer = new Float32Array(data.numberOfFrames)
          data.copyTo(buffer, { planeIndex: c, format })
          this.audioChannels[c].push(buffer)
        }

        data.close()
      },
      error: (e) => {
        console.error('AudioDecoder error:', e)
      },
    })

    this.decoder.configure(config)
  }

  public sendChunk(payload: ChunkPayload) {
    if (this.decoder?.state !== 'configured') {
      console.warn(
        'AudioEngine: sendChunk called but decoder is not configured',
        this.decoder?.state,
      )
      return
    }
    const chunk = new EncodedAudioChunk({
      type: payload.type,
      timestamp: payload.timestamp,
      duration: payload.duration,
      data: new Uint8Array(payload.data),
    })
    this.decoder.decode(chunk)
  }

  public async getAudioBuffer(
    audioContext: AudioContext,
  ): Promise<AudioBuffer | null> {
    if (this.decoder && this.decoder.state === 'configured') {
      try {
        await this.decoder.flush()
      } catch (e) {
        console.error('AudioDecoder flush error:', e)
      }
    }

    if (this.audioChannels.length === 0 || this.audioChannels[0].length === 0) {
      return null
    }

    let totalFrames = 0
    for (const chunk of this.audioChannels[0]) {
      totalFrames += chunk.length
    }

    try {
      const audioBuffer = audioContext.createBuffer(
        this.numberOfChannels,
        totalFrames,
        this.sampleRate,
      )

      for (let c = 0; c < this.numberOfChannels; c++) {
        const channelData = audioBuffer.getChannelData(c)
        let offset = 0
        for (const chunk of this.audioChannels[c]) {
          channelData.set(chunk, offset)
          offset += chunk.length
        }
      }

      return audioBuffer
    } catch (err) {
      console.error('Failed to create AudioBuffer', err)
      return null
    }
  }

  public reset() {
    this.audioChannels = []
    if (this.decoder && this.decoder.state !== 'closed') {
      this.decoder.reset()
    }
  }
}
