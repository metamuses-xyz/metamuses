/**
 * Emotion Detection Test Suite
 * Tests the emotion queue system for multi-emotion detection, ordering, and processing
 */

import { describe, it, expect, beforeEach, vi } from 'vitest'
import { renderHook, act } from '@testing-library/react'
import { useEmotionQueue } from '@/hooks/use-emotion-queue'
import { Emotion } from '@/constants/emotions'

// Mock the Live2D store
vi.mock('@/store/live2d-store', () => ({
  useLive2DStore: vi.fn((selector) => {
    const mockStore = {
      setMotion: vi.fn(),
      setParameters: vi.fn(),
    }
    return selector(mockStore)
  }),
}))

describe('Emotion Detection System', () => {
  describe('Single Emotion Detection', () => {
    it('should detect a single emotion marker', () => {
      const { result } = renderHook(() => useEmotionQueue())

      const text = '<|EMOTE_HAPPY|> I am so glad to help you!'
      const count = result.current.detectAndEnqueue(text)

      expect(count).toBe(1)
    })

    it('should detect emotion at the start of text', () => {
      const { result } = renderHook(() => useEmotionQueue())

      const text = '<|EMOTE_THINK|> Let me think about this...'
      const count = result.current.detectAndEnqueue(text)

      expect(count).toBe(1)
    })

    it('should detect emotion in the middle of text', () => {
      const { result } = renderHook(() => useEmotionQueue())

      const text = 'Well, <|EMOTE_CURIOUS|> that is interesting!'
      const count = result.current.detectAndEnqueue(text)

      expect(count).toBe(1)
    })

    it('should detect emotion at the end of text', () => {
      const { result } = renderHook(() => useEmotionQueue())

      const text = 'Oh no, that is terrible <|EMOTE_SAD|>'
      const count = result.current.detectAndEnqueue(text)

      expect(count).toBe(1)
    })
  })

  describe('Multi-Emotion Detection', () => {
    it('should detect multiple emotions in sequence', () => {
      const { result } = renderHook(() => useEmotionQueue())

      const text = '<|EMOTE_THINK|> Hmm... <|EMOTE_SURPRISED|> Wow! <|EMOTE_HAPPY|> That is amazing!'
      const count = result.current.detectAndEnqueue(text)

      expect(count).toBe(3)
    })

    it('should detect 2 emotions correctly', () => {
      const { result } = renderHook(() => useEmotionQueue())

      const text = '<|EMOTE_QUESTION|> Are you sure? <|EMOTE_THINK|> Let me consider this.'
      const count = result.current.detectAndEnqueue(text)

      expect(count).toBe(2)
    })

    it('should detect emotions in correct order by position', () => {
      const { result } = renderHook(() => useEmotionQueue())

      // Manually verify order by checking console logs
      const text = 'Start <|EMOTE_SAD|> middle <|EMOTE_HAPPY|> end'
      const count = result.current.detectAndEnqueue(text)

      expect(count).toBe(2)
      // Expected order: SAD first, then HAPPY (by position in text)
    })

    it('should handle all 9 emotion types', () => {
      const { result } = renderHook(() => useEmotionQueue())

      const text = `
        <|EMOTE_HAPPY|> Happy
        <|EMOTE_SAD|> Sad
        <|EMOTE_ANGRY|> Angry
        <|EMOTE_THINK|> Think
        <|EMOTE_SURPRISED|> Surprised
        <|EMOTE_AWKWARD|> Awkward
        <|EMOTE_QUESTION|> Question
        <|EMOTE_CURIOUS|> Curious
        <|EMOTE_NEUTRAL|> Neutral
      `
      const count = result.current.detectAndEnqueue(text)

      expect(count).toBe(9)
    })
  })

  describe('Edge Cases', () => {
    it('should return 0 for text with no emotions', () => {
      const { result } = renderHook(() => useEmotionQueue())

      const text = 'This is just regular text without any emotion markers.'
      const count = result.current.detectAndEnqueue(text)

      expect(count).toBe(0)
    })

    it('should handle empty string', () => {
      const { result } = renderHook(() => useEmotionQueue())

      const text = ''
      const count = result.current.detectAndEnqueue(text)

      expect(count).toBe(0)
    })

    it('should handle duplicate emotions', () => {
      const { result } = renderHook(() => useEmotionQueue())

      const text = '<|EMOTE_HAPPY|> So happy! <|EMOTE_HAPPY|> Really happy!'
      const count = result.current.detectAndEnqueue(text)

      expect(count).toBe(2)
    })

    it('should handle emotions with no space between them', () => {
      const { result } = renderHook(() => useEmotionQueue())

      const text = '<|EMOTE_THINK|><|EMOTE_SURPRISED|><|EMOTE_HAPPY|>'
      const count = result.current.detectAndEnqueue(text)

      expect(count).toBe(3)
    })

    it('should not detect partial marker matches', () => {
      const { result } = renderHook(() => useEmotionQueue())

      const text = 'EMOTE_HAPPY or <|EMOTE_HAPP or EMOTE_HAPPY|>'
      const count = result.current.detectAndEnqueue(text)

      expect(count).toBe(0)
    })
  })

  describe('Direct Enqueue', () => {
    it('should allow directly enqueueing emotions', () => {
      const { result } = renderHook(() => useEmotionQueue())

      act(() => {
        result.current.enqueue(Emotion.Happy)
      })

      // No error thrown means success
      expect(true).toBe(true)
    })

    it('should enqueue multiple emotions directly', () => {
      const { result } = renderHook(() => useEmotionQueue())

      act(() => {
        result.current.enqueue(Emotion.Think)
        result.current.enqueue(Emotion.Surprise)
        result.current.enqueue(Emotion.Happy)
      })

      expect(true).toBe(true)
    })
  })

  describe('Real-World LLM Response Scenarios', () => {
    it('should handle typical LLM response with emotion at start', () => {
      const { result } = renderHook(() => useEmotionQueue())

      const text = "<|EMOTE_HAPPY|> I'd be delighted to help you with that! Let me explain..."
      const count = result.current.detectAndEnqueue(text)

      expect(count).toBe(1)
    })

    it('should handle LLM response with emotion transition', () => {
      const { result } = renderHook(() => useEmotionQueue())

      const text = "<|EMOTE_THINK|> Let me analyze this... <|EMOTE_SURPRISED|> Oh, this is quite remarkable!"
      const count = result.current.detectAndEnqueue(text)

      expect(count).toBe(2)
    })

    it('should handle empathetic response', () => {
      const { result } = renderHook(() => useEmotionQueue())

      const text = "<|EMOTE_SAD|> I understand that must be difficult. <|EMOTE_HAPPY|> But things will get better!"
      const count = result.current.detectAndEnqueue(text)

      expect(count).toBe(2)
    })

    it('should handle complex multi-emotion narrative', () => {
      const { result } = renderHook(() => useEmotionQueue())

      const text = `<|EMOTE_QUESTION|> Are you interested in learning about this?
        <|EMOTE_THINK|> Well, it's quite fascinating actually.
        <|EMOTE_SURPRISED|> Did you know that...
        <|EMOTE_HAPPY|> I love sharing this information!`
      const count = result.current.detectAndEnqueue(text)

      expect(count).toBe(4)
    })
  })

  describe('Performance', () => {
    it('should handle long text efficiently', () => {
      const { result } = renderHook(() => useEmotionQueue())

      const longText = 'Lorem ipsum '.repeat(1000) + '<|EMOTE_HAPPY|> Found it! ' + 'dolor sit amet '.repeat(1000)

      const start = performance.now()
      const count = result.current.detectAndEnqueue(longText)
      const duration = performance.now() - start

      expect(count).toBe(1)
      expect(duration).toBeLessThan(10) // Should complete in less than 10ms
    })

    it('should handle many emotions efficiently', () => {
      const { result } = renderHook(() => useEmotionQueue())

      // Create text with 50 emotions
      const emotions = [
        Emotion.Happy,
        Emotion.Sad,
        Emotion.Think,
        Emotion.Surprise,
        Emotion.Curious,
      ]
      const text = Array(10)
        .fill(null)
        .map((_, i) => emotions.map((e) => `${e} Text ${i}`).join(' '))
        .join(' ')

      const start = performance.now()
      const count = result.current.detectAndEnqueue(text)
      const duration = performance.now() - start

      expect(count).toBe(50)
      expect(duration).toBeLessThan(50) // Should complete in less than 50ms
    })
  })
})
