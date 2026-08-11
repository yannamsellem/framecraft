import type { RenderInputEvent } from '../workers/render.worker'
import RenderWorker from '../workers/render.worker?worker'
import type { ChunkPayload } from './types'

export class RenderService {
  private worker: Worker | null = null

  constructor() {
    this.worker = new RenderWorker()
  }

  public init(canvas: HTMLCanvasElement) {
    if (!this.worker) return

    const offscreen = canvas.transferControlToOffscreen()
    const msg: RenderInputEvent = { type: 'INIT', canvas: offscreen }

    this.worker.postMessage(msg, [offscreen])
  }

  public configure(config: VideoDecoderConfig) {
    const msg: RenderInputEvent = {
      type: 'CONFIGURE',
      config,
    }

    this.worker?.postMessage(msg)
  }

  public sendChunk(payload: ChunkPayload) {
    const msg: RenderInputEvent = { type: 'CHUNK', payload }
    this.worker?.postMessage(msg, [payload.data])
  }

  public sync(time: number) {
    this.worker?.postMessage({ type: 'SYNC', time })
  }

  public flush() {
    this.worker?.postMessage({ type: 'FLUSH' })
  }

  public reset(time?: number) {
    this.worker?.postMessage({ type: 'RESET', time })
  }

  public terminate() {
    this.worker?.terminate()
    this.worker = null
  }
}
