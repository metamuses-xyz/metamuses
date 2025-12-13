/**
 * LLM Streaming Hook
 * Integrates LLM streaming with emotion detection and queue
 */

'use client'

import { useCallback, useRef } from 'react'
import { createLlmMarkerParser } from '@/lib/live2d/parser'
import { useEmotionQueue } from './use-emotion-queue'

export interface UseLlmStreamOptions {
  onText?: (text: string) => void
  onComplete?: () => void
}

export function useLlmStream(options: UseLlmStreamOptions = {}) {
  const { detectAndEnqueue } = useEmotionQueue()
  const accumulatedText = useRef('')

  const processStream = useCallback(async (stream: ReadableStream<Uint8Array>) => {
    const reader = stream.getReader()
    const decoder = new TextDecoder()

    const parser = createLlmMarkerParser({
      onLiteral: async (text) => {
        accumulatedText.current += text
        options.onText?.(text)
      },
      onSpecial: async (tag) => {
        // Detect and enqueue emotions from markers
        detectAndEnqueue(tag)
        console.log('[LLM] Marker detected:', tag)
      },
    })

    try {
      while (true) {
        const { done, value } = await reader.read()
        
        if (done) {
          await parser.end()
          options.onComplete?.()
          break
        }

        const chunk = decoder.decode(value, { stream: true })
        await parser.consume(chunk)
      }
    } catch (error) {
      console.error('[LLM] Stream error:', error)
      throw error
    } finally {
      reader.releaseLock()
    }

    return accumulatedText.current
  }, [detectAndEnqueue, options])

  const reset = useCallback(() => {
    accumulatedText.current = ''
  }, [])

  return {
    processStream,
    reset,
    getText: () => accumulatedText.current,
  }
}
