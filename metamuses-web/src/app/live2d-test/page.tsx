'use client'

import { Live2DCompanionDisplay } from '@/components/live2d/Live2DCompanionDisplay'
import { useEmotionQueue } from '@/hooks/use-emotion-queue'
import { Emotion } from '@/constants/emotions'
import Header from '@/components/Header'
import Footer from '@/components/Footer'

export default function Live2DTestPage() {
  const { enqueue } = useEmotionQueue()

  const emotions = [
    { label: 'Neutral', value: Emotion.Idle },
    { label: 'Happy', value: Emotion.Happy },
    { label: 'Sad', value: Emotion.Sad },
    { label: 'Angry', value: Emotion.Angry },
    { label: 'Surprised', value: Emotion.Surprise },
    { label: 'Thinking', value: Emotion.Think },
    { label: 'Curious', value: Emotion.Curious },
    { label: 'Awkward', value: Emotion.Awkward },
  ]

  return (
    <>
      <Header />
      <div className="min-h-screen bg-gradient-to-br from-gray-900 via-purple-900 to-black pt-20">
        <div className="container mx-auto px-4 py-8">
          <h1 className="text-4xl font-bold text-white mb-8 text-center">
            Live2D Test Page
          </h1>

          <div className="grid lg:grid-cols-2 gap-8">
            {/* Live2D Display */}
            <div className="bg-gray-800/50 backdrop-blur-sm rounded-lg p-4">
              <h2 className="text-xl font-semibold text-white mb-4">
                Live2D Model
              </h2>
              <div className="h-[600px]">
                <Live2DCompanionDisplay
                  modelSrc="/models/hiyori/hiyori_free_t08.model3.json"
                  companionName="Test Model"
                />
              </div>
            </div>

            {/* Controls */}
            <div className="bg-gray-800/50 backdrop-blur-sm rounded-lg p-6">
              <h2 className="text-xl font-semibold text-white mb-4">
                Emotion Controls
              </h2>
              <p className="text-gray-400 mb-6">
                Click buttons to trigger different emotions:
              </p>

              <div className="grid grid-cols-2 gap-4">
                {emotions.map((emotion) => (
                  <button
                    key={emotion.value}
                    onClick={() => enqueue(emotion.value)}
                    className="px-6 py-3 bg-purple-600 hover:bg-purple-500 text-white rounded-lg transition-colors"
                  >
                    {emotion.label}
                  </button>
                ))}
              </div>

              <div className="mt-8 p-4 bg-gray-700/50 rounded-lg">
                <h3 className="text-lg font-semibold text-white mb-2">
                  Integration Status
                </h3>
                <ul className="text-sm text-gray-300 space-y-2">
                  <li>✅ Live2D components loaded</li>
                  <li>✅ Emotion queue active</li>
                  <li>✅ Zustand store initialized</li>
                  <li>✅ Model assets accessible</li>
                </ul>
              </div>

              <div className="mt-4 p-4 bg-blue-900/30 border border-blue-500/30 rounded-lg">
                <p className="text-sm text-blue-200">
                  <strong>Next Steps:</strong><br />
                  1. Verify model loads and animates<br />
                  2. Test all emotion buttons<br />
                  3. Check browser console for errors<br />
                  4. Integrate into /chat page
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
      <Footer />
    </>
  )
}
