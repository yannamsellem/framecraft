export class MasterClock {
  private ctx: AudioContext | null = null
  private startTimeOffset: number = 0
  private isPlaying: boolean = false
  private pausedTime: number = 0

  private audioBuffer: AudioBuffer | null = null
  private sourceNode: AudioBufferSourceNode | null = null
  private gainNode: GainNode | null = null

  private currentVolume: number = 1
  private currentIsMuted: boolean = false

  constructor() {}

  private initCtx() {
    if (!this.ctx) {
      this.ctx = new AudioContext()
      this.gainNode = this.ctx.createGain()
      this.gainNode.connect(this.ctx.destination)
      this.applyVolume()
    }
  }

  public getAudioContext(): AudioContext {
    this.initCtx()
    return this.ctx!
  }

  public setAudioBuffer(buffer: AudioBuffer | null) {
    this.audioBuffer = buffer
    if (this.isPlaying) {
      this.startAudio(this.getCurrentTime())
    }
  }

  private applyVolume() {
    if (this.gainNode && this.ctx) {
      const val = this.currentIsMuted ? 0 : this.currentVolume
      // Smoothly transition volume to avoid popping
      this.gainNode.gain.setTargetAtTime(val, this.ctx.currentTime, 0.05)
    }
  }

  public setVolume(volume: number) {
    this.currentVolume = Math.max(0, Math.min(1, volume))
    this.applyVolume()
  }

  public setMuted(isMuted: boolean) {
    this.currentIsMuted = isMuted
    this.applyVolume()
  }

  private stopAudio() {
    if (this.sourceNode) {
      try {
        this.sourceNode.stop()
      } catch {
        // ignore error if already stopped
      }
      this.sourceNode.disconnect()
      this.sourceNode = null
    }
  }

  private startAudio(offset: number) {
    this.stopAudio()
    if (this.ctx && this.audioBuffer && this.gainNode) {
      this.sourceNode = this.ctx.createBufferSource()
      this.sourceNode.buffer = this.audioBuffer
      this.sourceNode.connect(this.gainNode)
      // start immediately (0) at the given offset within the buffer
      this.sourceNode.start(0, offset)
    }
  }

  public play(fromTime?: number) {
    this.initCtx()
    if (this.ctx!.state === 'suspended') {
      this.ctx!.resume().catch((e) => console.error(e))
    }

    if (fromTime !== undefined) {
      this.pausedTime = fromTime
    }

    this.startTimeOffset = this.ctx!.currentTime - this.pausedTime
    this.isPlaying = true

    this.startAudio(this.pausedTime)
  }

  public pause() {
    if (!this.isPlaying || !this.ctx) return
    this.pausedTime = this.ctx.currentTime - this.startTimeOffset
    this.isPlaying = false

    this.stopAudio()
  }

  public seek(time: number) {
    this.pausedTime = time
    if (this.isPlaying && this.ctx) {
      this.startTimeOffset = this.ctx.currentTime - this.pausedTime
      this.startAudio(this.pausedTime)
    }
  }

  public getCurrentTime(): number {
    if (!this.isPlaying || !this.ctx) {
      return this.pausedTime
    }
    return this.ctx.currentTime - this.startTimeOffset
  }

  public getIsPlaying(): boolean {
    return this.isPlaying
  }
}
