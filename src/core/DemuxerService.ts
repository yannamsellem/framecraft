import type {
  MessageOutputEvent,
  MetadataPayload,
  ChunkPayload,
} from '../workers/demux.worker'

export class DemuxerService {
  private worker: Worker | null = null
  private videoChunkCallback: ((chunk: ChunkPayload) => void) | null = null
  private audioChunkCallback: ((chunk: ChunkPayload) => void) | null = null
  private onCompleteCallback: (() => void) | null = null
  private metadataResolve: ((meta: MetadataPayload) => void) | null = null
  private metadataReject: ((err: Error) => void) | null = null

  constructor() {
    this.worker = new Worker(
      new URL('../workers/demux.worker.ts', import.meta.url),
      { type: 'module' },
    )

    this.worker.onmessage = (e: MessageEvent<MessageOutputEvent>) => {
      const data = e.data
      switch (data.type) {
        case 'METADATA_READY':
          this.metadataResolve?.(data.payload)
          break
        case 'VIDEO_CHUNK':
          this.videoChunkCallback?.(data.payload)
          break
        case 'AUDIO_CHUNK':
          this.audioChunkCallback?.(data.payload)
          break
        case 'DEMUX_COMPLETE':
          this.onCompleteCallback?.()
          break
        case 'ERROR':
          this.metadataReject?.(new Error(data.error))
          break
      }
    }
  }

  public onVideoChunk(callback: (chunk: ChunkPayload) => void) {
    this.videoChunkCallback = callback
  }

  public onAudioChunk(callback: (chunk: ChunkPayload) => void) {
    this.audioChunkCallback = callback
  }

  public onComplete(callback: () => void) {
    this.onCompleteCallback = callback
  }

  public async getMetadata(file: File) {
    const { promise, reject, resolve } =
      Promise.withResolvers<MetadataPayload>()

    if (!this.worker) {
      reject(new Error('Worker is not initialized or has been terminated.'))
      return promise
    }

    const handleMessage = ({ data }: MessageEvent<MessageOutputEvent>) => {
      const { type } = data

      if (type === 'METADATA_READY') {
        cleanup()
        resolve(data.payload)
      } else if (type === 'ERROR') {
        cleanup()
        reject(new Error(data.error))
      }
    }

    const handleError = (error: ErrorEvent) => {
      cleanup()
      reject(new Error(`Worker error: ${error.message}`))
    }

    const cleanup = () => {
      this.worker?.removeEventListener('message', handleMessage)
      this.worker?.removeEventListener('error', handleError)
    }

    this.worker.addEventListener('message', handleMessage)
    this.worker.addEventListener('error', handleError)

    this.worker.postMessage({ type: 'LOAD_FILE', file })

    return promise
  }

  public startDemuxing() {
    this.worker?.postMessage({ type: 'START_DEMUXING' })
  }

  /**
   * Terminates the worker to free up memory.
   */
  public terminate() {
    this.worker?.terminate()
    this.worker = null
  }
}
