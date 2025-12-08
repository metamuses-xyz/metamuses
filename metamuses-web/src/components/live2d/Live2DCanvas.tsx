/**
 * Live2D Canvas Component
 * Initializes and manages Pixi.js Application for Live2D rendering
 */

'use client'

import { Application } from '@pixi/app'
import { extensions } from '@pixi/extensions'
import { Ticker, TickerPlugin } from '@pixi/ticker'
import { useEffect, useRef, useState, type ReactNode } from 'react'

interface Live2DCanvasProps {
  width: number
  height: number
  resolution?: number
  className?: string
  children: (app: Application) => ReactNode
}

export function Live2DCanvas({
  width,
  height,
  resolution = 2,
  className = '',
  children,
}: Live2DCanvasProps) {
  const containerRef = useRef<HTMLDivElement>(null)
  const [pixiApp, setPixiApp] = useState<Application | null>(null)
  const canvasRef = useRef<HTMLCanvasElement | null>(null)

  useEffect(() => {
    if (!containerRef.current) return

    // Register Pixi ticker for Live2D
    extensions.add(TickerPlugin)

    const app = new Application({
      width: width * resolution,
      height: height * resolution,
      backgroundAlpha: 0,
      preserveDrawingBuffer: true,
    })

    canvasRef.current = app.view
    canvasRef.current.style.width = '100%'
    canvasRef.current.style.height = '100%'
    canvasRef.current.style.objectFit = 'cover'
    canvasRef.current.style.display = 'block'

    containerRef.current.appendChild(app.view)
    setPixiApp(app)

    return () => {
      app.destroy(true, { children: true })
      setPixiApp(null)
    }
  }, [])

  // Handle resize
  useEffect(() => {
    if (pixiApp) {
      pixiApp.renderer.resize(width, height)
    }
  }, [pixiApp, width, height])

  return (
    <div ref={containerRef} className={`h-full w-full ${className}`}>
      {pixiApp && children(pixiApp)}
    </div>
  )
}
