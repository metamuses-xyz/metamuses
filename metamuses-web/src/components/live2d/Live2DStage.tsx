/**
 * Live2D Stage Component
 * Main orchestrator combining Canvas and Model with responsive sizing
 */

'use client'

import { useEffect, useState } from 'react'
import { Live2DCanvas } from './Live2DCanvas'
import { Live2DModel } from './Live2DModel'

export interface Live2DStageProps {
  modelSrc: string
  modelId?: string
  className?: string
  mouthOpenSize?: number
  onModelLoaded?: () => void
}

export function Live2DStage({
  modelSrc,
  modelId,
  className = '',
  mouthOpenSize = 0,
  onModelLoaded,
}: Live2DStageProps) {
  const [dimensions, setDimensions] = useState({ width: 800, height: 600 })

  // Handle window resize
  useEffect(() => {
    function handleResize() {
      setDimensions({
        width: window.innerWidth,
        height: window.innerHeight,
      })
    }

    handleResize()
    window.addEventListener('resize', handleResize)
    return () => window.removeEventListener('resize', handleResize)
  }, [])

  return (
    <div className={`relative ${className}`}>
      <Live2DCanvas
        width={dimensions.width}
        height={dimensions.height}
        resolution={2}
        className="absolute inset-0"
      >
        {(app) => (
          <Live2DModel
            app={app}
            modelSrc={modelSrc}
            modelId={modelId}
            mouthOpenSize={mouthOpenSize}
            onModelLoaded={onModelLoaded}
          />
        )}
      </Live2DCanvas>
    </div>
  )
}
