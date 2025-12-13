/**
 * Idle Animator
 * Natural idle animations for Live2D models: blinking, breathing, subtle head sway
 */

import type { ModelParameters } from '@/constants/emotions'

interface IdleConfig {
  // Blinking settings
  blinkEnabled: boolean
  blinkMinInterval: number // Minimum time between blinks (ms)
  blinkMaxInterval: number // Maximum time between blinks (ms)
  blinkDuration: number // How long a blink takes (ms)

  // Breathing settings
  breathEnabled: boolean
  breathFrequency: number // Breaths per second
  breathAmplitude: number // Intensity of breathing (0-1)

  // Head sway settings
  swayEnabled: boolean
  swayXFrequency: number // Horizontal sway cycles per second
  swayXAmplitude: number // Degrees of horizontal sway
  swayZFrequency: number // Tilt sway cycles per second
  swayZAmplitude: number // Degrees of tilt sway
}

const DEFAULT_CONFIG: IdleConfig = {
  blinkEnabled: true,
  blinkMinInterval: 2500,
  blinkMaxInterval: 5000,
  blinkDuration: 150,

  breathEnabled: true,
  breathFrequency: 0.2, // About 12 breaths per minute
  breathAmplitude: 0.5,

  swayEnabled: true,
  swayXFrequency: 0.08,
  swayXAmplitude: 3,
  swayZFrequency: 0.06,
  swayZAmplitude: 2,
}

export class IdleAnimator {
  private config: IdleConfig
  private enabled: boolean = true
  private paused: boolean = false

  // Blinking state
  private lastBlinkTime: number = 0
  private nextBlinkInterval: number = 0
  private blinkProgress: number = 0 // 0 = not blinking, 0-1 = closing, 1 = closed
  private isBlinking: boolean = false
  private blinkStartTime: number = 0

  // Random seed for natural variation
  private phaseOffset: number = Math.random() * Math.PI * 2

  constructor(config: Partial<IdleConfig> = {}) {
    this.config = { ...DEFAULT_CONFIG, ...config }
    this.resetBlinkTimer()
  }

  /**
   * Reset the blink timer with random interval
   */
  private resetBlinkTimer(): void {
    const { blinkMinInterval, blinkMaxInterval } = this.config
    this.nextBlinkInterval =
      blinkMinInterval + Math.random() * (blinkMaxInterval - blinkMinInterval)
    this.lastBlinkTime = performance.now()
  }

  /**
   * Calculate blink eye values (0 = closed, 1 = open)
   */
  private calculateBlink(now: number): { leftEyeOpen: number; rightEyeOpen: number } | null {
    if (!this.config.blinkEnabled) return null

    const timeSinceLastBlink = now - this.lastBlinkTime

    // Check if it's time to blink
    if (!this.isBlinking && timeSinceLastBlink >= this.nextBlinkInterval) {
      this.isBlinking = true
      this.blinkStartTime = now
    }

    if (!this.isBlinking) return null

    const blinkElapsed = now - this.blinkStartTime
    const { blinkDuration } = this.config

    if (blinkElapsed >= blinkDuration) {
      // Blink complete
      this.isBlinking = false
      this.resetBlinkTimer()
      return null
    }

    // Calculate blink progress (close then open)
    const halfDuration = blinkDuration / 2
    let eyeOpen: number

    if (blinkElapsed < halfDuration) {
      // Closing phase
      eyeOpen = 1 - blinkElapsed / halfDuration
    } else {
      // Opening phase
      eyeOpen = (blinkElapsed - halfDuration) / halfDuration
    }

    // Add slight asymmetry for natural look
    const asymmetry = 0.02 * Math.sin(now * 0.001)

    return {
      leftEyeOpen: Math.max(0, Math.min(1, eyeOpen - asymmetry)),
      rightEyeOpen: Math.max(0, Math.min(1, eyeOpen + asymmetry)),
    }
  }

  /**
   * Calculate breathing value
   */
  private calculateBreathing(now: number): number {
    if (!this.config.breathEnabled) return 0

    const { breathFrequency, breathAmplitude } = this.config
    // Use sine wave with offset for natural variation
    return Math.sin(now * 0.001 * breathFrequency * Math.PI * 2 + this.phaseOffset) * breathAmplitude
  }

  /**
   * Calculate subtle head sway
   */
  private calculateSway(now: number): { angleX: number; angleZ: number } {
    if (!this.config.swayEnabled) return { angleX: 0, angleZ: 0 }

    const { swayXFrequency, swayXAmplitude, swayZFrequency, swayZAmplitude } = this.config
    const time = now * 0.001 // Convert to seconds

    // Use different frequencies and phases for natural, non-repetitive motion
    const angleX =
      Math.sin(time * swayXFrequency * Math.PI * 2 + this.phaseOffset) * swayXAmplitude
    const angleZ =
      Math.sin(time * swayZFrequency * Math.PI * 2 + this.phaseOffset + Math.PI / 3) *
      swayZAmplitude

    return { angleX, angleZ }
  }

  /**
   * Update and get all idle animation parameters
   * Call this every frame
   */
  update(now: number = performance.now()): Partial<ModelParameters> {
    if (!this.enabled || this.paused) return {}

    const params: Partial<ModelParameters> = {}

    // Blinking
    const blinkValues = this.calculateBlink(now)
    if (blinkValues) {
      params.leftEyeOpen = blinkValues.leftEyeOpen
      params.rightEyeOpen = blinkValues.rightEyeOpen
    }

    // Breathing
    const breath = this.calculateBreathing(now)
    if (breath !== 0) {
      params.breath = breath
    }

    // Head sway
    const sway = this.calculateSway(now)
    if (sway.angleX !== 0 || sway.angleZ !== 0) {
      params.angleX = sway.angleX
      params.angleZ = sway.angleZ
    }

    return params
  }

  /**
   * Get idle parameters as additive modifiers
   * Use this when you want to add idle motion on top of other animations
   */
  getAdditiveParams(now: number = performance.now()): Partial<ModelParameters> {
    if (!this.enabled || this.paused) return {}

    const params: Partial<ModelParameters> = {}

    // Breathing is always additive
    const breath = this.calculateBreathing(now)
    if (breath !== 0) {
      params.breath = breath
    }

    // Sway is additive
    const sway = this.calculateSway(now)
    if (sway.angleX !== 0) {
      params.angleX = sway.angleX
    }
    if (sway.angleZ !== 0) {
      params.angleZ = sway.angleZ
    }

    return params
  }

  /**
   * Force a blink to happen now
   */
  triggerBlink(): void {
    if (!this.isBlinking && this.config.blinkEnabled) {
      this.isBlinking = true
      this.blinkStartTime = performance.now()
    }
  }

  /**
   * Pause idle animations (e.g., during emotion expressions)
   */
  pause(): void {
    this.paused = true
  }

  /**
   * Resume idle animations
   */
  resume(): void {
    this.paused = false
    this.resetBlinkTimer()
  }

  /**
   * Enable/disable all idle animations
   */
  setEnabled(enabled: boolean): void {
    this.enabled = enabled
    if (enabled) {
      this.resetBlinkTimer()
    }
  }

  /**
   * Update configuration
   */
  setConfig(config: Partial<IdleConfig>): void {
    this.config = { ...this.config, ...config }
  }

  /**
   * Get current configuration
   */
  getConfig(): IdleConfig {
    return { ...this.config }
  }

  /**
   * Check if currently blinking
   */
  isCurrentlyBlinking(): boolean {
    return this.isBlinking
  }

  /**
   * Check if idle animations are active
   */
  isActive(): boolean {
    return this.enabled && !this.paused
  }
}

// Factory function
export function createIdleAnimator(config?: Partial<IdleConfig>): IdleAnimator {
  return new IdleAnimator(config)
}
