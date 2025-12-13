/**
 * Mouse Tracking Hook
 * Tracks cursor position and converts to Live2D model parameters
 * for eye/head tracking behavior
 */

'use client'

import { useEffect, useState, useRef, useCallback, useMemo, RefObject } from 'react'
import type { ModelParameters } from '@/constants/emotions'

interface MousePosition {
  x: number // 0-1 normalized (0 = left, 1 = right)
  y: number // 0-1 normalized (0 = top, 1 = bottom)
}

interface TrackingConfig {
  // Head rotation ranges (degrees)
  headAngleXRange: number // Max horizontal head rotation
  headAngleYRange: number // Max vertical head rotation

  // Eye movement ranges
  eyeBallXRange: number // Max horizontal eye movement
  eyeBallYRange: number // Max vertical eye movement

  // Smoothing (0-1, higher = more smooth, slower response)
  smoothing: number

  // Whether to track when mouse is outside container
  trackOutside: boolean

  // Sensitivity multiplier
  sensitivity: number
}

interface TrackingResult {
  // Normalized mouse position (0-1)
  mousePos: MousePosition

  // Model parameters for tracking
  params: Partial<ModelParameters>

  // Whether mouse is inside the tracked area
  isInsideContainer: boolean

  // Whether tracking is active
  isTracking: boolean
}

const DEFAULT_CONFIG: TrackingConfig = {
  headAngleXRange: 20, // -20 to +20 degrees horizontal
  headAngleYRange: 15, // -15 to +15 degrees vertical
  eyeBallXRange: 1, // -1 to +1
  eyeBallYRange: 1, // -1 to +1
  smoothing: 0.15, // Smooth but responsive
  trackOutside: true,
  sensitivity: 1.0,
}

/**
 * Convert normalized mouse position to model parameters
 */
function mouseToParams(
  mousePos: MousePosition,
  config: TrackingConfig
): Partial<ModelParameters> {
  // Convert from 0-1 to -1 to +1 range (centered)
  const normalizedX = (mousePos.x - 0.5) * 2 * config.sensitivity
  const normalizedY = (mousePos.y - 0.5) * 2 * config.sensitivity

  // Clamp to valid range
  const clampedX = Math.max(-1, Math.min(1, normalizedX))
  const clampedY = Math.max(-1, Math.min(1, normalizedY))

  return {
    // Head follows mouse with dampened movement
    angleY: clampedX * config.headAngleXRange,
    angleX: -clampedY * config.headAngleYRange, // Negative because looking up = positive Y
  }
}

/**
 * Hook to track mouse position relative to a container element
 */
export function useMouseTracking(
  containerRef: RefObject<HTMLElement | null>,
  config: Partial<TrackingConfig> = {}
): TrackingResult {
  const fullConfig = { ...DEFAULT_CONFIG, ...config }

  const [mousePos, setMousePos] = useState<MousePosition>({ x: 0.5, y: 0.5 })
  const [smoothedPos, setSmoothedPos] = useState<MousePosition>({ x: 0.5, y: 0.5 })
  const [isInsideContainer, setIsInsideContainer] = useState(false)
  const [isTracking, setIsTracking] = useState(false)

  const animationFrameRef = useRef<number | null>(null)
  const targetPosRef = useRef<MousePosition>({ x: 0.5, y: 0.5 })

  // Smooth the mouse position using lerp
  const updateSmoothedPosition = useCallback(() => {
    setSmoothedPos((current) => {
      const target = targetPosRef.current
      const smoothing = fullConfig.smoothing

      const newX = current.x + (target.x - current.x) * (1 - smoothing)
      const newY = current.y + (target.y - current.y) * (1 - smoothing)

      // Stop animating if close enough to target
      const dx = Math.abs(newX - target.x)
      const dy = Math.abs(newY - target.y)

      if (dx > 0.001 || dy > 0.001) {
        animationFrameRef.current = requestAnimationFrame(updateSmoothedPosition)
      } else {
        animationFrameRef.current = null
      }

      return { x: newX, y: newY }
    })
  }, [fullConfig.smoothing])

  // Handle mouse movement
  const handleMouseMove = useCallback(
    (e: MouseEvent) => {
      const container = containerRef.current
      if (!container) return

      const rect = container.getBoundingClientRect()

      // Check if mouse is inside container
      const inside =
        e.clientX >= rect.left &&
        e.clientX <= rect.right &&
        e.clientY >= rect.top &&
        e.clientY <= rect.bottom

      setIsInsideContainer(inside)

      // Only track if inside or trackOutside is enabled
      if (!inside && !fullConfig.trackOutside) {
        return
      }

      // Calculate normalized position (0-1)
      const x = (e.clientX - rect.left) / rect.width
      const y = (e.clientY - rect.top) / rect.height

      // Clamp to valid range
      const clampedX = Math.max(0, Math.min(1, x))
      const clampedY = Math.max(0, Math.min(1, y))

      const newPos = { x: clampedX, y: clampedY }
      setMousePos(newPos)
      targetPosRef.current = newPos
      setIsTracking(true)

      // Start smoothing animation if not running
      if (!animationFrameRef.current) {
        animationFrameRef.current = requestAnimationFrame(updateSmoothedPosition)
      }
    },
    [containerRef, fullConfig.trackOutside, updateSmoothedPosition]
  )

  // Handle mouse leaving the window
  const handleMouseLeave = useCallback(() => {
    setIsTracking(false)
    setIsInsideContainer(false)

    // Gradually return to center
    targetPosRef.current = { x: 0.5, y: 0.5 }
    if (!animationFrameRef.current) {
      animationFrameRef.current = requestAnimationFrame(updateSmoothedPosition)
    }
  }, [updateSmoothedPosition])

  // Set up event listeners
  useEffect(() => {
    const container = containerRef.current
    if (!container) return

    // Use document-level tracking for smoother experience
    document.addEventListener('mousemove', handleMouseMove)
    document.addEventListener('mouseleave', handleMouseLeave)

    return () => {
      document.removeEventListener('mousemove', handleMouseMove)
      document.removeEventListener('mouseleave', handleMouseLeave)

      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current)
      }
    }
  }, [containerRef, handleMouseMove, handleMouseLeave])

  // Memoize parameters to prevent unnecessary re-renders
  // Only recalculate when smoothedPos actually changes
  const params = useMemo(() =>
    mouseToParams(smoothedPos, fullConfig),
    [smoothedPos.x, smoothedPos.y, fullConfig.headAngleXRange, fullConfig.headAngleYRange, fullConfig.sensitivity]
  )

  // Memoize the entire return object to maintain referential equality
  return useMemo(() => ({
    mousePos: smoothedPos,
    params,
    isInsideContainer,
    isTracking,
  }), [smoothedPos, params, isInsideContainer, isTracking])
}

/**
 * Hook variant that uses window-level tracking (no container ref needed)
 */
export function useWindowMouseTracking(
  config: Partial<TrackingConfig> = {}
): Omit<TrackingResult, 'isInsideContainer'> {
  const fullConfig = { ...DEFAULT_CONFIG, ...config }

  const [smoothedPos, setSmoothedPos] = useState<MousePosition>({ x: 0.5, y: 0.5 })
  const [isTracking, setIsTracking] = useState(false)

  const animationFrameRef = useRef<number | null>(null)
  const targetPosRef = useRef<MousePosition>({ x: 0.5, y: 0.5 })

  const updateSmoothedPosition = useCallback(() => {
    setSmoothedPos((current) => {
      const target = targetPosRef.current
      const smoothing = fullConfig.smoothing

      const newX = current.x + (target.x - current.x) * (1 - smoothing)
      const newY = current.y + (target.y - current.y) * (1 - smoothing)

      const dx = Math.abs(newX - target.x)
      const dy = Math.abs(newY - target.y)

      if (dx > 0.001 || dy > 0.001) {
        animationFrameRef.current = requestAnimationFrame(updateSmoothedPosition)
      } else {
        animationFrameRef.current = null
      }

      return { x: newX, y: newY }
    })
  }, [fullConfig.smoothing])

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      const x = e.clientX / window.innerWidth
      const y = e.clientY / window.innerHeight

      targetPosRef.current = { x, y }
      setIsTracking(true)

      if (!animationFrameRef.current) {
        animationFrameRef.current = requestAnimationFrame(updateSmoothedPosition)
      }
    }

    const handleMouseLeave = () => {
      setIsTracking(false)
      targetPosRef.current = { x: 0.5, y: 0.5 }
      if (!animationFrameRef.current) {
        animationFrameRef.current = requestAnimationFrame(updateSmoothedPosition)
      }
    }

    window.addEventListener('mousemove', handleMouseMove)
    document.addEventListener('mouseleave', handleMouseLeave)

    return () => {
      window.removeEventListener('mousemove', handleMouseMove)
      document.removeEventListener('mouseleave', handleMouseLeave)
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current)
      }
    }
  }, [updateSmoothedPosition])

  // Memoize parameters
  const params = useMemo(() =>
    mouseToParams(smoothedPos, fullConfig),
    [smoothedPos.x, smoothedPos.y, fullConfig.headAngleXRange, fullConfig.headAngleYRange, fullConfig.sensitivity]
  )

  // Memoize return object
  return useMemo(() => ({
    mousePos: smoothedPos,
    params,
    isTracking,
  }), [smoothedPos, params, isTracking])
}
