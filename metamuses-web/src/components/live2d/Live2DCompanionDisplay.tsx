'use client'

import dynamic from 'next/dynamic'
import { memo, useCallback } from 'react'

const Live2DStage = dynamic(
  () => import('./index').then((m) => m.Live2DStage),
  { ssr: false }
)

interface Live2DCompanionDisplayProps {
  modelSrc: string
  companionName: string
  className?: string
}

// Memoized component to prevent re-renders when parent state changes
export const Live2DCompanionDisplay = memo(function Live2DCompanionDisplay({
  modelSrc,
  companionName,
  className = ''
}: Live2DCompanionDisplayProps) {
  // Memoize the callback to prevent re-renders
  const handleModelLoaded = useCallback(() => {
    console.log(`${companionName} model loaded`)
  }, [companionName])

  return (
    <div className={`relative w-full h-full bg-gradient-to-br from-purple-900/20 to-blue-900/20 rounded-lg overflow-hidden ${className}`}>
      <Live2DStage
        modelSrc={modelSrc}
        modelId={companionName}
        className="w-full h-full"
        onModelLoaded={handleModelLoaded}
      />

      {/* Companion Name Overlay */}
      <div className="absolute top-4 left-4 px-4 py-2 bg-black/50 backdrop-blur-sm rounded-lg">
        <h3 className="text-white font-semibold">{companionName}</h3>
        <p className="text-xs text-gray-400">Live2D Model</p>
      </div>
    </div>
  )
})
