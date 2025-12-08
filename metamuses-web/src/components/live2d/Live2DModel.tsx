/**
 * Live2D Model Component
 * Loads and renders a Live2D model using pixi-live2d-display
 */

'use client'

import { Application } from '@pixi/app'
import { Ticker } from '@pixi/ticker'
import { useEffect, useRef } from 'react'
import { Live2DModel as PixiLive2DModel, Live2DFactory } from 'pixi-live2d-display/cubism4'
import { useLive2DStore } from '@/store/live2d-store'

interface Live2DModelProps {
  app: Application
  modelSrc: string
  modelId?: string
  mouthOpenSize?: number
  onModelLoaded?: () => void
}

export function Live2DModel({
  app,
  modelSrc,
  modelId,
  mouthOpenSize = 0,
  onModelLoaded,
}: Live2DModelProps) {
  const modelRef = useRef<PixiLive2DModel | null>(null)
  const { currentMotion, modelParameters, scale, position } = useLive2DStore()

  // Register Live2D ticker
  useEffect(() => {
    PixiLive2DModel.registerTicker(Ticker)
  }, [])

  // Load model
  useEffect(() => {
    let mounted = true

    async function loadModel() {
      try {
        // Create model instance
        const live2DModel = new PixiLive2DModel()

        // Setup model with source URL (matching AIRI implementation)
        await Live2DFactory.setupLive2DModel(live2DModel, modelSrc, {
          autoInteract: false,
        })

        if (!mounted) {
          live2DModel.destroy()
          return
        }

        // Add to stage
        app.stage.addChild(live2DModel)
        live2DModel.anchor.set(0.5, 0.5)

        // Set initial position and scale
        const heightScale = (app.screen.height * 0.95) / live2DModel.height * 2.2
        const widthScale = (app.screen.width * 0.95) / live2DModel.width * 2.2
        const modelScale = Math.min(heightScale, widthScale)

        live2DModel.scale.set(modelScale * scale, modelScale * scale)
        live2DModel.x = app.screen.width / 2 + position.x
        live2DModel.y = app.screen.height + position.y

        modelRef.current = live2DModel

        // Apply initial parameters
        const coreModel = live2DModel.internalModel.coreModel
        coreModel.setParameterValueById('ParamAngleX', modelParameters.angleX)
        coreModel.setParameterValueById('ParamAngleY', modelParameters.angleY)
        coreModel.setParameterValueById('ParamAngleZ', modelParameters.angleZ)
        coreModel.setParameterValueById('ParamEyeLOpen', modelParameters.leftEyeOpen)
        coreModel.setParameterValueById('ParamEyeROpen', modelParameters.rightEyeOpen)
        coreModel.setParameterValueById('ParamMouthOpenY', modelParameters.mouthOpen)
        coreModel.setParameterValueById('ParamMouthForm', modelParameters.mouthForm)
        coreModel.setParameterValueById('ParamBodyAngleX', modelParameters.bodyAngleX)
        coreModel.setParameterValueById('ParamBodyAngleY', modelParameters.bodyAngleY)
        coreModel.setParameterValueById('ParamBodyAngleZ', modelParameters.bodyAngleZ)
        coreModel.setParameterValueById('ParamBreath', modelParameters.breath)

        onModelLoaded?.()

        console.log('[Live2D] Model loaded:', modelSrc)
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
  }, [app, modelSrc, modelId])

  // Update motion when currentMotion changes
  useEffect(() => {
    if (modelRef.current && currentMotion) {
      try {
        modelRef.current.motion(currentMotion.group, currentMotion.index)
        console.log('[Live2D] Motion triggered:', currentMotion.group)
      } catch (error) {
        console.warn('[Live2D] Motion failed:', currentMotion, error)
      }
    }
  }, [currentMotion])

  // Update parameters when they change
  useEffect(() => {
    if (modelRef.current) {
      const coreModel = modelRef.current.internalModel.coreModel
      coreModel.setParameterValueById('ParamAngleX', modelParameters.angleX)
      coreModel.setParameterValueById('ParamAngleY', modelParameters.angleY)
      coreModel.setParameterValueById('ParamAngleZ', modelParameters.angleZ)
      coreModel.setParameterValueById('ParamEyeLOpen', modelParameters.leftEyeOpen)
      coreModel.setParameterValueById('ParamEyeROpen', modelParameters.rightEyeOpen)
      coreModel.setParameterValueById('ParamMouthOpenY', modelParameters.mouthOpen)
      coreModel.setParameterValueById('ParamMouthForm', modelParameters.mouthForm)
      coreModel.setParameterValueById('ParamBodyAngleX', modelParameters.bodyAngleX)
      coreModel.setParameterValueById('ParamBodyAngleY', modelParameters.bodyAngleY)
      coreModel.setParameterValueById('ParamBodyAngleZ', modelParameters.bodyAngleZ)
      coreModel.setParameterValueById('ParamBreath', modelParameters.breath)
    }
  }, [modelParameters])

  // Update mouth open for lip sync
  useEffect(() => {
    if (modelRef.current) {
      const coreModel = modelRef.current.internalModel.coreModel
      coreModel.setParameterValueById('ParamMouthOpenY', mouthOpenSize)
    }
  }, [mouthOpenSize])

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

  return null // Renders to Pixi stage, not DOM
}
