/**
 * Live2D Model Component
 * Loads and renders a Live2D model with smooth animations,
 * idle behaviors (blinking, breathing), and mouse tracking
 */

'use client'

import { Application } from '@pixi/app'
import { Ticker } from '@pixi/ticker'
import { useEffect, useRef, useCallback } from 'react'
import { Live2DModel as PixiLive2DModel, Live2DFactory } from 'pixi-live2d-display/cubism4'
import { useLive2DStore } from '@/store/live2d-store'
import { createParameterAnimator, easeOutCubic } from '@/lib/live2d/parameter-animator'
import { createIdleAnimator } from '@/lib/live2d/idle-animator'
import { DEFAULT_MODEL_PARAMETERS, EMOTION_MOTION_CONFIG, DEFAULT_TRANSITION_DURATION } from '@/constants/emotions'
import type { ModelParameters } from '@/constants/emotions'

interface Live2DModelProps {
  app: Application
  modelSrc: string
  modelId?: string
  mouthOpenSize?: number
  onModelLoaded?: () => void
  // Mouse tracking parameters (from useMouseTracking hook)
  mouseTrackingParams?: Partial<ModelParameters>
  // Enable/disable features
  enableIdleAnimations?: boolean
  enableMouseTracking?: boolean
}

// Map our parameter names to Live2D parameter IDs
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
}

export function Live2DModel({
  app,
  modelSrc,
  modelId,
  mouthOpenSize = 0,
  onModelLoaded,
  mouseTrackingParams,
  enableIdleAnimations = true,
  enableMouseTracking = true,
}: Live2DModelProps) {
  const modelRef = useRef<PixiLive2DModel | null>(null)
  const { currentMotion, modelParameters, scale, position, setParameters } = useLive2DStore()

  // Animation system refs
  const parameterAnimatorRef = useRef(createParameterAnimator())
  const idleAnimatorRef = useRef(createIdleAnimator())
  const tickerCallbackRef = useRef<(() => void) | null>(null)
  const lastEmotionParamsRef = useRef<Partial<ModelParameters>>({})
  const isEmotionActiveRef = useRef(false)

  // Helper to apply parameters to model
  const applyParamsToModel = useCallback((params: Partial<ModelParameters>) => {
    if (!modelRef.current) return

    const coreModel = modelRef.current.internalModel.coreModel
    for (const [key, value] of Object.entries(params)) {
      if (typeof value !== 'number') continue
      const paramId = PARAM_ID_MAP[key] || key
      try {
        coreModel.setParameterValueById(paramId, value)
      } catch {
        // Parameter may not exist
      }
    }
  }, [])

  // Register Live2D ticker
  useEffect(() => {
    PixiLive2DModel.registerTicker(Ticker)
  }, [])

  // Load model
  useEffect(() => {
    let mounted = true

    async function loadModel() {
      try {
        const live2DModel = new PixiLive2DModel()

        await Live2DFactory.setupLive2DModel(live2DModel, modelSrc, {
          autoInteract: false,
        })

        if (!mounted) {
          live2DModel.destroy()
          return
        }

        app.stage.addChild(live2DModel)
        live2DModel.anchor.set(0.5, 0.5)

        const heightScale = (app.screen.height * 0.95) / live2DModel.height * 2.2
        const widthScale = (app.screen.width * 0.95) / live2DModel.width * 2.2
        const modelScale = Math.min(heightScale, widthScale)

        live2DModel.scale.set(modelScale * scale, modelScale * scale)
        live2DModel.x = app.screen.width / 2 + position.x
        live2DModel.y = app.screen.height + position.y

        modelRef.current = live2DModel

        // Initialize parameter animator with core model reference
        const coreModel = live2DModel.internalModel.coreModel
        parameterAnimatorRef.current.setModel(coreModel)

        // Apply default parameters
        applyParamsToModel(DEFAULT_MODEL_PARAMETERS)

        onModelLoaded?.()
        console.log('[Live2D] Model loaded with animation system:', modelSrc)
      } catch (error) {
        console.error('[Live2D] Failed to load model:', error)
      }
    }

    loadModel()

    return () => {
      mounted = false
      if (modelRef.current) {
        app.stage.removeChild(modelRef.current)
        modelRef.current.destroy()
        modelRef.current = null
      }
    }
  }, [app, modelSrc, modelId, scale, position, applyParamsToModel, onModelLoaded])

  // Set up main animation loop
  useEffect(() => {
    if (!modelRef.current) return

    const animator = parameterAnimatorRef.current
    const idleAnimator = idleAnimatorRef.current

    // Configure idle animator
    idleAnimator.setEnabled(enableIdleAnimations)

    // Main animation loop
    const animationLoop = () => {
      if (!modelRef.current) return

      const now = performance.now()

      // Start with default parameters
      const finalParams: Partial<ModelParameters> = { ...DEFAULT_MODEL_PARAMETERS }

      // Layer 1: Idle animations (breathing, blinking, subtle sway)
      if (enableIdleAnimations && !isEmotionActiveRef.current) {
        const idleParams = idleAnimator.update(now)
        Object.assign(finalParams, idleParams)
      }

      // Layer 2: Mouse tracking (if enabled and not during emotion)
      if (enableMouseTracking && mouseTrackingParams && !isEmotionActiveRef.current) {
        // Blend mouse tracking with current values
        if (mouseTrackingParams.angleX !== undefined) {
          finalParams.angleX = (finalParams.angleX || 0) + mouseTrackingParams.angleX * 0.5
        }
        if (mouseTrackingParams.angleY !== undefined) {
          finalParams.angleY = (finalParams.angleY || 0) + mouseTrackingParams.angleY * 0.5
        }
      }

      // Layer 3: Emotion parameters (animated transitions)
      const animatedParams = animator.update()
      if (Object.keys(animatedParams).length > 0) {
        Object.assign(finalParams, animatedParams)
      }

      // Layer 4: Override with active emotion parameters if set
      if (isEmotionActiveRef.current && Object.keys(lastEmotionParamsRef.current).length > 0) {
        Object.assign(finalParams, lastEmotionParamsRef.current)
      }

      // Layer 5: External mouth control (for lip sync)
      if (mouthOpenSize > 0) {
        finalParams.mouthOpen = mouthOpenSize
      }

      // Apply all parameters to model
      applyParamsToModel(finalParams)
    }

    // Add to ticker
    tickerCallbackRef.current = animationLoop
    app.ticker.add(animationLoop)

    return () => {
      if (tickerCallbackRef.current) {
        app.ticker.remove(tickerCallbackRef.current)
        tickerCallbackRef.current = null
      }
    }
  }, [app, enableIdleAnimations, enableMouseTracking, mouseTrackingParams, mouthOpenSize, applyParamsToModel])

  // Handle motion and emotion parameter changes from store
  useEffect(() => {
    if (!modelRef.current || !currentMotion) return

    try {
      // Trigger the motion
      modelRef.current.motion(currentMotion.group, currentMotion.index)
      console.log('[Live2D] Motion triggered:', currentMotion.group)

      // Find emotion config for this motion
      const emotionEntry = Object.entries(EMOTION_MOTION_CONFIG).find(
        ([, config]) => config.motion === currentMotion.group
      )

      if (emotionEntry) {
        const [emotionKey, config] = emotionEntry
        const transitionDuration = config.transitionDuration || DEFAULT_TRANSITION_DURATION
        const holdDuration = config.holdDuration || 1500

        // Mark emotion as active
        isEmotionActiveRef.current = true

        // Pause idle animations during emotion
        idleAnimatorRef.current.pause()

        // Animate to emotion parameters
        if (config.parameters) {
          parameterAnimatorRef.current.animateTo(config.parameters, transitionDuration, easeOutCubic)
          lastEmotionParamsRef.current = config.parameters
          console.log('[Live2D] Animating to emotion:', emotionKey, 'over', transitionDuration, 'ms')
        }

        // Schedule return to idle (unless it's already idle)
        if (currentMotion.group !== 'Idle') {
          setTimeout(() => {
            // Check if still the same emotion (not overridden)
            if (isEmotionActiveRef.current) {
              isEmotionActiveRef.current = false
              lastEmotionParamsRef.current = {}

              // Animate back to default parameters
              parameterAnimatorRef.current.animateTo(DEFAULT_MODEL_PARAMETERS, 350, easeOutCubic)

              // Resume idle animations
              idleAnimatorRef.current.resume()

              console.log('[Live2D] Returning to idle after emotion')
            }
          }, holdDuration)
        }
      }
    } catch (error) {
      console.warn('[Live2D] Motion failed:', currentMotion, error)
    }
  }, [currentMotion])

  // Handle direct parameter changes from store (for backwards compatibility)
  useEffect(() => {
    if (!modelRef.current) return

    // If store parameters change and we're not in an emotion, animate to them
    if (!isEmotionActiveRef.current && Object.keys(modelParameters).some(key => {
      const defaultVal = DEFAULT_MODEL_PARAMETERS[key as keyof typeof DEFAULT_MODEL_PARAMETERS]
      return modelParameters[key as keyof typeof modelParameters] !== defaultVal
    })) {
      parameterAnimatorRef.current.animateTo(modelParameters, 200, easeOutCubic)
    }
  }, [modelParameters])

  // Update position
  useEffect(() => {
    if (modelRef.current) {
      modelRef.current.x = app.screen.width / 2 + position.x
      modelRef.current.y = app.screen.height + position.y
    }
  }, [position, app.screen])

  // Update scale
  useEffect(() => {
    if (modelRef.current) {
      const heightScale = (app.screen.height * 0.95) / modelRef.current.height * 2.2
      const widthScale = (app.screen.width * 0.95) / modelRef.current.width * 2.2
      const modelScale = Math.min(heightScale, widthScale)
      modelRef.current.scale.set(modelScale * scale, modelScale * scale)
    }
  }, [scale, app.screen])

  return null
}
