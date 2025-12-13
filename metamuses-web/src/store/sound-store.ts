/**
 * Sound Settings Store
 * Manages sound preferences (enabled/disabled, volume)
 */

import { create } from 'zustand'
import { persist } from 'zustand/middleware'

export interface SoundState {
  // Settings
  enabled: boolean
  volume: number // 0.0 - 1.0

  // Actions
  setEnabled: (enabled: boolean) => void
  setVolume: (volume: number) => void
  toggle: () => void
}

export const useSoundStore = create<SoundState>()(
  persist(
    (set) => ({
      // Initial state
      enabled: true,
      volume: 0.3,

      // Actions
      setEnabled: (enabled) => set({ enabled }),

      setVolume: (volume) => set({ volume: Math.max(0, Math.min(1, volume)) }),

      toggle: () => set((state) => ({ enabled: !state.enabled })),
    }),
    {
      name: 'sound-settings', // localStorage key
    }
  )
)
