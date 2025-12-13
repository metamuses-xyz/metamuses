/**
 * Audio Manager
 * Handles playing sound effects with preloading and volume control
 */

export interface AudioManagerOptions {
  volume?: number // 0.0 to 1.0
  preload?: boolean
  enableSounds?: boolean
}

export class AudioManager {
  private audioCache: Map<string, HTMLAudioElement> = new Map()
  private volume: number
  private enableSounds: boolean

  constructor(options: AudioManagerOptions = {}) {
    this.volume = options.volume ?? 0.5
    this.enableSounds = options.enableSounds ?? true
  }

  /**
   * Preload an audio file
   */
  async preload(src: string): Promise<void> {
    if (this.audioCache.has(src)) {
      return
    }

    try {
      const audio = new Audio(src)
      audio.volume = this.volume
      audio.preload = 'auto'

      // Wait for audio to be ready
      await new Promise<void>((resolve, reject) => {
        audio.addEventListener('canplaythrough', () => resolve(), { once: true })
        audio.addEventListener('error', reject, { once: true })
        audio.load()
      })

      this.audioCache.set(src, audio)
      console.log('[Audio] Preloaded:', src)
    } catch (error) {
      console.warn('[Audio] Failed to preload:', src, error)
    }
  }

  /**
   * Preload multiple audio files
   */
  async preloadAll(sources: string[]): Promise<void> {
    const promises = sources.map(src => this.preload(src))
    await Promise.allSettled(promises)
  }

  /**
   * Play a sound effect
   */
  async play(src: string): Promise<void> {
    if (!this.enableSounds) {
      return
    }

    try {
      let audio = this.audioCache.get(src)

      if (!audio) {
        // Not preloaded, create on-the-fly
        audio = new Audio(src)
        audio.volume = this.volume
        this.audioCache.set(src, audio)
      }

      // Clone the audio element to allow overlapping sounds
      const audioClone = audio.cloneNode() as HTMLAudioElement
      audioClone.volume = this.volume

      await audioClone.play()
      console.log('[Audio] Playing:', src)
    } catch (error) {
      console.warn('[Audio] Failed to play:', src, error)
    }
  }

  /**
   * Stop a currently playing sound
   */
  stop(src: string): void {
    const audio = this.audioCache.get(src)
    if (audio) {
      audio.pause()
      audio.currentTime = 0
    }
  }

  /**
   * Stop all sounds
   */
  stopAll(): void {
    this.audioCache.forEach(audio => {
      audio.pause()
      audio.currentTime = 0
    })
  }

  /**
   * Set volume (0.0 to 1.0)
   */
  setVolume(volume: number): void {
    this.volume = Math.max(0, Math.min(1, volume))
    this.audioCache.forEach(audio => {
      audio.volume = this.volume
    })
  }

  /**
   * Get current volume
   */
  getVolume(): number {
    return this.volume
  }

  /**
   * Enable or disable sounds
   */
  setEnabled(enabled: boolean): void {
    this.enableSounds = enabled
    if (!enabled) {
      this.stopAll()
    }
  }

  /**
   * Check if sounds are enabled
   */
  isEnabled(): boolean {
    return this.enableSounds
  }

  /**
   * Clear audio cache
   */
  clear(): void {
    this.stopAll()
    this.audioCache.clear()
  }
}

// Singleton instance
let audioManagerInstance: AudioManager | null = null

/**
 * Get or create the global audio manager instance
 */
export function getAudioManager(options?: AudioManagerOptions): AudioManager {
  if (!audioManagerInstance) {
    audioManagerInstance = new AudioManager(options)
  }
  return audioManagerInstance
}
