/**
 * Example: How to integrate Live2D into chat page
 *
 * This file shows how to add Live2D display to the chat interface.
 * Copy relevant parts into src/app/chat/page.tsx
 */

'use client'

import { useState } from 'react'
import { Live2DCompanionDisplay } from './Live2DCompanionDisplay'
import { useEmotionQueue } from '@/hooks/use-emotion-queue'

export function ChatPageWithLive2D() {
  const [selectedCompanion, setSelectedCompanion] = useState({
    id: '1',
    name: 'Luna the Mystic'
  })

  const { detectAndEnqueue } = useEmotionQueue()

  // When AI responds, detect emotions
  const handleAIResponse = (message: string) => {
    // Display the message
    console.log('AI:', message)

    // Detect and trigger emotions
    detectAndEnqueue(message)
  }

  return (
    <div className="flex flex-col lg:flex-row min-h-screen">
      {/* Left: Chat Interface */}
      <div className="w-full lg:w-1/2 flex flex-col">
        <div className="flex-1 p-4">
          {/* Your existing chat messages */}
        </div>
        <div className="p-4">
          {/* Your existing input */}
        </div>
      </div>

      {/* Right: Live2D Display */}
      <div className="w-full lg:w-1/2 h-[50vh] lg:h-screen lg:sticky lg:top-0">
        {selectedCompanion && (
          <Live2DCompanionDisplay
            modelSrc="/models/hiyori/hiyori_free_t08.model3.json"
            companionName={selectedCompanion.name}
          />
        )}
      </div>
    </div>
  )
}

/**
 * Integration Steps:
 *
 * 1. Import components:
 *    import { Live2DCompanionDisplay } from '@/components/live2d/Live2DCompanionDisplay'
 *    import { useEmotionQueue } from '@/hooks/use-emotion-queue'
 *
 * 2. Use emotion queue:
 *    const { detectAndEnqueue } = useEmotionQueue()
 *
 * 3. Trigger emotions when AI responds:
 *    detectAndEnqueue(aiMessage)
 *
 * 4. Add Live2D display to layout
 *
 * 5. Test with emotion markers:
 *    - "I'm happy! <|EMOTE_HAPPY|>"
 *    - "Interesting... <|EMOTE_THINK|>"
 *    - "Wow! <|EMOTE_SURPRISED|>"
 */
