/**
 * Live2D State Management (Zustand)
 * Manages Live2D model state, parameters, and motion
 */

import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import { DEFAULT_MODEL_PARAMETERS, type ModelParameters } from '@/constants/emotions'

export interface Live2DState {
  // Model configuration
  position: { x: number; y: number }
  scale: number
  
  // Current motion
  currentMotion: { group: string; index?: number }
  
  // Model parameters (facial expressions, body movements)
  modelParameters: ModelParameters
  
  // Actions
  setPosition: (position: { x: number; y: number }) => void
  setScale: (scale: number) => void
  setMotion: (motion: { group: string; index?: number }) => void
  setModelParameter: <K extends keyof ModelParameters>(
    key: K,
    value: ModelParameters[K]
  ) => void
  resetParameters: () => void
}

export const useLive2DStore = create<Live2DState>()(
  persist(
    (set) => ({
      // Initial state
      position: { x: 0, y: 0 },
      scale: 1,
      currentMotion: { group: 'Idle', index: 0 },
      modelParameters: { ...DEFAULT_MODEL_PARAMETERS },
      
      // Actions
      setPosition: (position) => set({ position }),
      
      setScale: (scale) => set({ scale }),
      
      setMotion: (motion) => set({ currentMotion: motion }),
      
      setModelParameter: (key, value) =>
        set((state) => ({
          modelParameters: {
            ...state.modelParameters,
            [key]: value,
          },
        })),
      
      resetParameters: () =>
        set({ modelParameters: { ...DEFAULT_MODEL_PARAMETERS } }),
    }),
    {
      name: 'live2d-storage', // localStorage key
      partialize: (state) => ({
        position: state.position,
        scale: state.scale,
        modelParameters: state.modelParameters,
      }),
    }
  )
)
