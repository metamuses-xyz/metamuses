/**
 * Emotion Queue Hook
 * Manages emotion detection and queuing from LLM responses
 */

'use client'

import { useEffect, useRef } from 'react'
import { Emotion, EMOTION_MOTION_CONFIG, EMOTION_VALUES, EMOTION_ANIMATION_DURATIONS, DEFAULT_ANIMATION_DURATION } from '@/constants/emotions'
import { createQueue } from '@/lib/live2d/queue'
import { useLive2DStore } from '@/store/live2d-store'

export function useEmotionQueue() {
  const setMotion = useLive2DStore((state) => state.setMotion)
  const setParameters = useLive2DStore((state) => state.setParameters)
  const queueRef = useRef(createQueue<Emotion>({
    handlers: [
      async (ctx) => {
        const config = EMOTION_MOTION_CONFIG[ctx.data]
        const motionName = config.motion

        // Apply emotion-specific parameters if defined
        if (config.parameters && Object.keys(config.parameters).length > 0) {
          setParameters(config.parameters)
          console.log('[Emotion] Applied parameters:', config.parameters)
        }

        // Trigger motion
        setMotion({ group: motionName })
        console.log('[Emotion] Triggered:', ctx.data, '→', motionName)

        // Wait for animation to complete
        const duration = EMOTION_ANIMATION_DURATIONS[motionName] || DEFAULT_ANIMATION_DURATION
        await new Promise(resolve => setTimeout(resolve, duration))

        // Smart transition: Only return to idle if queue is empty
        const hasMoreEmotions = ctx.queueLength > 0
        if (!hasMoreEmotions) {
          console.log('[Emotion] Queue empty, returning to idle')
          setMotion({ group: 'Idle' })
          // Reset parameters to default when returning to idle
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
