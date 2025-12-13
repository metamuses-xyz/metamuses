/**
 * Parameter Animator
 * Smooth transitions for Live2D model parameters with lerp and easing
 */

import type { ModelParameters } from '@/constants/emotions'

// Easing functions
export const easeOutCubic = (t: number): number => 1 - Math.pow(1 - t, 3)
export const easeInOutCubic = (t: number): number =>
  t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2
export const easeOutQuad = (t: number): number => 1 - (1 - t) * (1 - t)
export const easeInOutQuad = (t: number): number =>
  t < 0.5 ? 2 * t * t : 1 - Math.pow(-2 * t + 2, 2) / 2
export const linear = (t: number): number => t

export type EasingFunction = (t: number) => number

interface AnimationTarget {
  parameter: string
  from: number
  to: number
  startTime: number
  duration: number
  easing: EasingFunction
}

// Map parameter names to Live2D parameter IDs
const PARAM_ID_MAP: Record<string, string> = {
  angleX: 'ParamAngleX',
  angleY: 'ParamAngleY',
  angleZ: 'ParamAngleZ',
  leftEyeOpen: 'ParamEyeLOpen',
  rightEyeOpen: 'ParamEyeROpen',
  mouthOpen: 'ParamMouthOpenY',
  mouthForm: 'ParamMouthForm',
  bodyAngleX: 'ParamBodyAngleX',
  bodyAngleY: 'ParamBodyAngleY',
  bodyAngleZ: 'ParamBodyAngleZ',
  breath: 'ParamBreath',
  eyeBallX: 'ParamEyeBallX',
  eyeBallY: 'ParamEyeBallY',
  eyeBrowLY: 'ParamBrowLY',
  eyeBrowRY: 'ParamBrowRY',
}

export class ParameterAnimator {
  private targets: Map<string, AnimationTarget> = new Map()
  private currentValues: Map<string, number> = new Map()
  private coreModel: unknown = null

  /**
   * Set the Live2D core model reference
   */
  setModel(coreModel: unknown): void {
    this.coreModel = coreModel
  }

  /**
   * Get current value of a parameter
   */
  getCurrentValue(key: string): number {
    // Try to get from current values cache
    if (this.currentValues.has(key)) {
      return this.currentValues.get(key)!
    }

    // Try to get from model
    if (this.coreModel) {
      const paramId = PARAM_ID_MAP[key] || key
      try {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const value = (this.coreModel as any).getParameterValueById?.(paramId)
        if (typeof value === 'number') {
          return value
        }
      } catch {
        // Parameter may not exist
      }
    }

    // Return default value based on parameter type
    if (key.includes('Open')) return 1
    if (key.includes('angle') || key.includes('Angle')) return 0
    if (key.includes('mouth') || key.includes('Mouth')) return 0
    return 0
  }

  /**
   * Animate parameters to target values with easing
   */
  animateTo(
    params: Partial<ModelParameters>,
    duration: number = 300,
    easing: EasingFunction = easeOutCubic
  ): void {
    const now = performance.now()

    for (const [key, value] of Object.entries(params)) {
      if (typeof value !== 'number') continue

      const from = this.getCurrentValue(key)

      // Skip if already at target (with tolerance)
      if (Math.abs(from - value) < 0.001) continue

      this.targets.set(key, {
        parameter: key,
        from,
        to: value,
        startTime: now,
        duration,
        easing,
      })
    }
  }

  /**
   * Set parameters immediately without animation
   */
  setImmediate(params: Partial<ModelParameters>): void {
    for (const [key, value] of Object.entries(params)) {
      if (typeof value !== 'number') continue
      this.currentValues.set(key, value)
      this.targets.delete(key) // Cancel any ongoing animation
    }
  }

  /**
   * Update animations and return current parameter values
   * Call this every frame in the animation loop
   */
  update(): Partial<ModelParameters> {
    const result: Partial<ModelParameters> = {}
    const now = performance.now()
    const completed: string[] = []

    for (const [key, target] of this.targets) {
      const elapsed = now - target.startTime
      const progress = Math.min(1, elapsed / target.duration)
      const easedProgress = target.easing(progress)
      const value = target.from + (target.to - target.from) * easedProgress

      result[key as keyof ModelParameters] = value
      this.currentValues.set(key, value)

      if (progress >= 1) {
        completed.push(key)
      }
    }

    // Clean up completed animations
    for (const key of completed) {
      this.targets.delete(key)
    }

    return result
  }

  /**
   * Apply parameter values to the Live2D model
   */
  applyToModel(params: Partial<ModelParameters>): void {
    if (!this.coreModel) return

    for (const [key, value] of Object.entries(params)) {
      if (typeof value !== 'number') continue
      const paramId = PARAM_ID_MAP[key] || key
      try {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        ;(this.coreModel as any).setParameterValueById?.(paramId, value)
      } catch {
        // Parameter may not exist on this model
      }
    }
  }

  /**
   * Get all current animated and static values
   */
  getAllCurrentValues(): Partial<ModelParameters> {
    const result: Partial<ModelParameters> = {}
    for (const [key, value] of this.currentValues) {
      result[key as keyof ModelParameters] = value
    }
    return result
  }

  /**
   * Check if any animations are currently running
   */
  isAnimating(): boolean {
    return this.targets.size > 0
  }

  /**
   * Cancel all ongoing animations
   */
  cancelAll(): void {
    this.targets.clear()
  }

  /**
   * Cancel animation for a specific parameter
   */
  cancel(key: string): void {
    this.targets.delete(key)
  }

  /**
   * Reset all values to defaults
   */
  reset(): void {
    this.targets.clear()
    this.currentValues.clear()
  }
}

// Singleton instance for global use
let animatorInstance: ParameterAnimator | null = null

export function getParameterAnimator(): ParameterAnimator {
  if (!animatorInstance) {
    animatorInstance = new ParameterAnimator()
  }
  return animatorInstance
}

/**
 * Create a new animator instance (for component-scoped use)
 */
export function createParameterAnimator(): ParameterAnimator {
  return new ParameterAnimator()
}
