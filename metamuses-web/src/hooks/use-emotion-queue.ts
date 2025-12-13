/**
 * Emotion Queue Hook
 * Manages emotion detection and queuing from LLM responses
 * Now uses smooth transitions via the animation system
 */

'use client'

import { useEffect, useRef } from 'react'
import { Emotion, EMOTION_MOTION_CONFIG, EMOTION_SOUND_MAP, EMOTION_VALUES, DEFAULT_TRANSITION_DURATION } from '@/constants/emotions'
import { createQueue } from '@/lib/live2d/queue'
import { useLive2DStore } from '@/store/live2d-store'
import { useSoundStore } from '@/store/sound-store'
import { getAudioManager } from '@/lib/audio/audio-manager'

export function useEmotionQueue() {
  const setMotion = useLive2DStore((state) => state.setMotion)
  const setParameters = useLive2DStore((state) => state.setParameters)
  const { enabled: soundEnabled, volume } = useSoundStore()
  const audioManagerRef = useRef(getAudioManager({ volume: 0.3, enableSounds: true }))

  // Preload all emotion sounds on mount
  useEffect(() => {
    const soundFiles = Object.values(EMOTION_SOUND_MAP)
    audioManagerRef.current.preloadAll(soundFiles).catch(err => {
      console.warn('[Emotion] Failed to preload sounds:', err)
    })
  }, [])

  // Sync audio manager with sound store settings
  useEffect(() => {
    audioManagerRef.current.setEnabled(soundEnabled)
    audioManagerRef.current.setVolume(volume)
  }, [soundEnabled, volume])

  const queueRef = useRef(createQueue<Emotion>({
    handlers: [
      async (ctx) => {
        const config = EMOTION_MOTION_CONFIG[ctx.data]
        const motionName = config.motion
        const transitionDuration = config.transitionDuration || DEFAULT_TRANSITION_DURATION
        const holdDuration = config.holdDuration || 1500

        // Play sound effect for this emotion
        const soundPath = EMOTION_SOUND_MAP[ctx.data]
        if (soundPath) {
          audioManagerRef.current.play(soundPath).catch(err => {
            console.warn('[Emotion] Failed to play sound:', soundPath, err)
          })
        }

        // Note: Parameters are now handled by Live2DModel via the animation system
        // We just need to set them in the store and the animator will smooth them
        if (config.parameters && Object.keys(config.parameters).length > 0) {
          setParameters(config.parameters)
          console.log('[Emotion] Set parameters for smooth transition:', ctx.data)
        }

        // Trigger motion - the Live2DModel will handle smooth parameter animation
        setMotion({ group: motionName })
        console.log('[Emotion] Triggered:', ctx.data, '→', motionName,
          `(transition: ${transitionDuration}ms, hold: ${holdDuration}ms)`)

        // Wait for the hold duration (animation system handles the transitions)
        await new Promise(resolve => setTimeout(resolve, holdDuration))

        // Smart transition: Only return to idle if queue is empty
        const hasMoreEmotions = ctx.queueLength > 0
        if (!hasMoreEmotions) {
          console.log('[Emotion] Queue empty, returning to idle')
          setMotion({ group: 'Idle' })
          // Reset parameters - animation system will smooth the transition back
          setParameters({})
        } else {
          console.log('[Emotion] Queue has', ctx.queueLength, 'more emotion(s), transitioning...')
          // Next emotion will trigger automatically with its own parameters
        }
      },
    ],
  }))

  return {
    enqueue: (emotion: Emotion) => queueRef.current.enqueue(emotion),

    detectAndEnqueue: (text: string): number => {
      // Find all emotions with their positions
      const found: Array<{emotion: Emotion, position: number}> = []

      for (const emotion of EMOTION_VALUES) {
        let index = 0
        while ((index = text.indexOf(emotion, index)) !== -1) {
          found.push({ emotion: emotion as Emotion, position: index })
          index += emotion.length
        }
      }

      // Sort by position (order in text) and enqueue
      found.sort((a, b) => a.position - b.position)
      found.forEach(({ emotion }) => {
        queueRef.current.enqueue(emotion)
        console.log('[Emotion] Detected:', emotion, 'at position', found.find(f => f.emotion === emotion)?.position)
      })

      if (found.length > 0) {
        console.log('[Emotion] Total emotions detected:', found.length)
      }

      return found.length
    },
  }
}
