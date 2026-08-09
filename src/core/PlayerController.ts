import { DemuxerService } from './DemuxerService'
import { RenderService } from './RenderService'
import { MasterClock } from './clock/MasterClock'
import { AudioEngine } from './audio/AudioEngine'
import type { MetadataPayload } from '../workers/demux.worker'

export class PlayerController {
  private demuxer: DemuxerService
  private renderer: RenderService
  private clock: MasterClock
  private audio: AudioEngine

  private rafId: number = 0

  private metadataCallback: ((metadata: MetadataPayload) => void) | null = null
  private timeUpdateCallback: ((time: number) => void) | null = null
  private playbackEndCallback: (() => void) | null = null

  private duration: number = 0

  constructor() {
    this.demuxer = new DemuxerService()
    this.renderer = new RenderService()
    this.clock = new MasterClock()
    this.audio = new AudioEngine()

    // Wire internal chunk streams together
    this.demuxer.onVideoChunk((chunk) => {
      this.renderer.sendChunk(chunk)
    })

    this.demuxer.onAudioChunk((chunk) => {
      this.audio.sendChunk(chunk)
    })

    // eslint-disable-next-line @typescript-eslint/no-misused-promises
    this.demuxer.onComplete(async () => {
      const audioCtx = this.clock.getAudioContext()
      const buffer = await this.audio.getAudioBuffer(audioCtx)
      if (buffer) {
        this.clock.setAudioBuffer(buffer)
      }
    })
  }

  private isCanvasAttached = false
  private currentFile: File | null = null

  public attachCanvas(canvas: HTMLCanvasElement) {
    if (this.isCanvasAttached)
      throw new Error('PlayerController: Canvas already attached')

    this.renderer.init(canvas)
    this.isCanvasAttached = true
  }

  public onMetadata(callback: (metadata: MetadataPayload) => void) {
    this.metadataCallback = callback
  }

  public onTimeUpdate(callback: (time: number) => void) {
    this.timeUpdateCallback = callback
  }
  public onPlaybackEnd(callback: () => void) {
    this.playbackEndCallback = callback
  }

  public async load(file: File) {
    if (this.currentFile === file) return
    this.currentFile = file

    try {
      const metadata = await this.demuxer.getMetadata(file)
      this.duration = metadata.duration

      this.metadataCallback?.(metadata)

      this.renderer.configure(metadata.videoConfig)
      if (metadata.audioConfig) {
        this.audio.configure(metadata.audioConfig)
      }

      this.demuxer.startDemuxing()
    } catch (err) {
      console.error('PlayerController: Failed to load file', err)
      throw err
    }
  }

  public play(fromTime?: number) {
    this.clock.play(fromTime)
    this.startLoop()
  }

  public pause() {
    this.clock.pause()
    cancelAnimationFrame(this.rafId)
  }

  public seek(time: number) {
    this.clock.seek(time)
    this.renderer.reset(time)

    this.timeUpdateCallback?.(time)
  }

  public setVolume(volume: number) {
    this.clock.setVolume(volume)
  }

  public setMuted(isMuted: boolean) {
    this.clock.setMuted(isMuted)
  }

  public getIsPlaying(): boolean {
    return this.clock.getIsPlaying()
  }

  private startLoop() {
    cancelAnimationFrame(this.rafId)

    const loop = () => {
      let time = this.clock.getCurrentTime()

      if (this.duration > 0 && time >= this.duration) {
        time = this.duration
        this.clock.seek(time)
        this.pause()
        this.playbackEndCallback?.()
      }

      this.timeUpdateCallback?.(time)

      this.renderer.sync(time)

      if (this.clock.getIsPlaying()) {
        this.rafId = requestAnimationFrame(loop)
      }
    }

    this.rafId = requestAnimationFrame(loop)
  }

  public destroy() {
    cancelAnimationFrame(this.rafId)
    this.demuxer.terminate()
    this.renderer.terminate()
    this.audio.reset()
  }
}
