/**
 * Live2D Stage Component
 * Main orchestrator combining Canvas and Model with responsive sizing
 * Includes mouse tracking for eye/head following
 */

'use client'

import { useEffect, useState, useRef } from 'react'
import { Live2DCanvas } from './Live2DCanvas'
import { Live2DModel } from './Live2DModel'
import { useMouseTracking } from '@/hooks/use-mouse-tracking'

export interface Live2DStageProps {
  modelSrc: string
  modelId?: string
  className?: string
  mouthOpenSize?: number
  onModelLoaded?: () => void
  // Feature toggles
  enableIdleAnimations?: boolean
  enableMouseTracking?: boolean
}

export function Live2DStage({
  modelSrc,
  modelId,
  className = '',
  mouthOpenSize = 0,
  onModelLoaded,
  enableIdleAnimations = true,
  enableMouseTracking = true,
}: Live2DStageProps) {
  const [dimensions, setDimensions] = useState({ width: 800, height: 600 })
  const containerRef = useRef<HTMLDivElement>(null)

  // Mouse tracking for eye/head following
  const { params: mouseTrackingParams } = useMouseTracking(containerRef, {
    headAngleXRange: 20,
    headAngleYRange: 15,
    smoothing: 0.12,
    trackOutside: true,
  })

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
    <div ref={containerRef} className={`relative ${className}`}>
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
            mouseTrackingParams={enableMouseTracking ? mouseTrackingParams : undefined}
            enableIdleAnimations={enableIdleAnimations}
            enableMouseTracking={enableMouseTracking}
          />
        )}
      </Live2DCanvas>
    </div>
  )
}
