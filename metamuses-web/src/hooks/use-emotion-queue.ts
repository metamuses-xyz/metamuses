/**
 * Emotion Queue Hook
 * Manages emotion detection and queuing from LLM responses
 */

'use client'

import { useEffect, useRef } from 'react'
import { Emotion, EMOTION_MOTION_MAP, EMOTION_VALUES } from '@/constants/emotions'
import { createQueue } from '@/lib/live2d/queue'
import { useLive2DStore } from '@/store/live2d-store'

export function useEmotionQueue() {
  const setMotion = useLive2DStore((state) => state.setMotion)
  const queueRef = useRef(createQueue<Emotion>({
    handlers: [
      async (ctx) => {
        const motionName = EMOTION_MOTION_MAP[ctx.data]
        setMotion({ group: motionName })
        console.log('[Emotion] Triggered:', ctx.data, '→', motionName)
      },
    ],
  }))

  return {
    enqueue: (emotion: Emotion) => queueRef.current.enqueue(emotion),
    detectAndEnqueue: (text: string) => {
      for (const emotion of EMOTION_VALUES) {
        if (text.includes(emotion)) {
          queueRef.current.enqueue(emotion as Emotion)
          return true
        }
      }
      return false
    },
  }
}
