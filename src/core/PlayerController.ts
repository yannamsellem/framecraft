import type { TimelineBlock } from '../store/useTimelineStore'
import { DemuxerService } from './DemuxerService'
import { RenderService } from './RenderService'
import { AudioEngine } from './audio/AudioEngine'
import { MasterClock } from './clock/MasterClock'
import type { MetadataPayload } from './types'

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

  private blocks: TimelineBlock[] = []
  private activeBlockId: string | null = null

  public setTimelineState(
    blocks: TimelineBlock[],
    activeBlockId: string | null,
  ) {
    this.blocks = blocks
    this.activeBlockId = activeBlockId
  }

  constructor() {
    this.demuxer = new DemuxerService()
    this.renderer = new RenderService()
    this.clock = new MasterClock()
    this.audio = new AudioEngine()

    this.demuxer.onVideoChunk((chunk) => this.renderer.sendChunk(chunk))
    this.demuxer.onAudioChunk((chunk) => this.audio.sendChunk(chunk))

    // eslint-disable-next-line @typescript-eslint/no-misused-promises
    this.demuxer.onComplete(async () => {
      const audioCtx = this.clock.getAudioContext()
      const buffer = await this.audio.getAudioBuffer(audioCtx)
      if (buffer) this.clock.setAudioBuffer(buffer)
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

      await this.demuxer.startDemuxing()
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

  private syncWithTimeline(time: number): number {
    if (this.activeBlockId) {
      return this.handleLoopMode(time, this.blocks, this.activeBlockId)
    }

    if (this.blocks.length > 0) {
      return this.handleGlobalMode(time, this.blocks)
    }

    return time
  }

  private handleLoopMode(
    time: number,
    blocks: TimelineBlock[],
    activeBlockId: string,
  ): number {
    const activeBlock = blocks.find((b) => b.id === activeBlockId)
    if (!activeBlock) return time

    if (time < activeBlock.start || time >= activeBlock.end) {
      this.seek(activeBlock.start)
      return activeBlock.start
    }
    return time
  }

  private handleGlobalMode(time: number, blocks: TimelineBlock[]): number {
    const currentBlock = blocks.find((b) => time >= b.start && time < b.end)

    if (!currentBlock) {
      const nextBlock = blocks.find((b) => b.start > time)
      if (nextBlock) {
        this.seek(nextBlock.start)
        return nextBlock.start
      }
    }

    return time
  }

  private handlePlaybackEnd(time: number): number | false {
    const endTime =
      this.blocks.length > 0
        ? this.blocks[this.blocks.length - 1].end
        : this.duration

    if (endTime > 0 && time >= endTime) {
      this.seek(endTime)
      this.pause()
      this.playbackEndCallback?.()
      return endTime
    }

    return false
  }

  private startLoop() {
    cancelAnimationFrame(this.rafId)

    const loop = () => {
      let time = this.syncWithTimeline(this.clock.getCurrentTime())

      const endedTime = this.handlePlaybackEnd(time)
      if (typeof endedTime === 'number') time = endedTime

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
