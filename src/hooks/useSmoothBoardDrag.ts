import { useState, useRef, useEffect, useCallback } from 'react'

interface SmoothDragState {
  x: number
  y: number
  rotate: number
  isDragging: boolean
}

interface UseSmoothBoardDragOptions {
  /** Maximum drag distance in pixels before heavy elastic resistance */
  maxDistance?: number
  /** Rotation factor per horizontal pixel (e.g. 0.025) */
  rotationFactor?: number
  /** Spring stiffness for release snapback */
  springStiffness?: number
  /** Spring damping ratio for release snapback (higher = smoother, no pendulum oscillation) */
  springDamping?: number
}

export function useSmoothBoardDrag({
  maxDistance = 240,
  rotationFactor = 0.025,
  springStiffness = 180,
  springDamping = 22,
}: UseSmoothBoardDragOptions = {}) {
  const [dragState, setDragState] = useState<SmoothDragState>({
    x: 0,
    y: 0,
    rotate: 0,
    isDragging: false,
  })

  // Mutable refs for high-frequency 60/120fps physics loop
  const posRef = useRef({ x: 0, y: 0 })
  const velRef = useRef({ x: 0, y: 0 })
  const isDraggingRef = useRef(false)
  const dragStartPointerRef = useRef({ x: 0, y: 0 })
  const dragStartPosRef = useRef({ x: 0, y: 0 })
  const hasDraggedPastThresholdRef = useRef(false)
  const pointerHistoryRef = useRef<Array<{ x: number; y: number; time: number }>>([])
  const rafIdRef = useRef<number | null>(null)
  const lastTimeRef = useRef<number | null>(null)

  // Spring snapback animation loop (critically damped smooth return, not a pendulum)
  const startSpringLoop = useCallback(() => {
    if (rafIdRef.current !== null) return

    lastTimeRef.current = performance.now()

    const step = (now: number) => {
      if (isDraggingRef.current) {
        rafIdRef.current = null
        return
      }

      const dt = Math.min((now - (lastTimeRef.current || now)) / 1000, 0.033)
      lastTimeRef.current = now

      // Hooke's Law Spring Force + Damping Force towards (0, 0)
      // F_spring = -k * x
      // F_damping = -c * v
      const fx = -springStiffness * posRef.current.x - springDamping * velRef.current.x
      const fy = -springStiffness * posRef.current.y - springDamping * velRef.current.y

      // Integrate velocity and position
      velRef.current.x += fx * dt
      velRef.current.y += fy * dt

      posRef.current.x += velRef.current.x * dt
      posRef.current.y += velRef.current.y * dt

      // Rest condition: when displacement and velocity are negligible, stop loop
      if (
        Math.hypot(posRef.current.x, posRef.current.y) < 0.2 &&
        Math.hypot(velRef.current.x, velRef.current.y) < 0.5
      ) {
        posRef.current = { x: 0, y: 0 }
        velRef.current = { x: 0, y: 0 }
        setDragState({
          x: 0,
          y: 0,
          rotate: 0,
          isDragging: false,
        })
        rafIdRef.current = null
        return
      }

      setDragState({
        x: posRef.current.x,
        y: posRef.current.y,
        rotate: posRef.current.x * rotationFactor,
        isDragging: false,
      })

      rafIdRef.current = requestAnimationFrame(step)
    }

    rafIdRef.current = requestAnimationFrame(step)
  }, [springStiffness, springDamping, rotationFactor])

  // Pointer event handlers
  const handlePointerDown = useCallback((e: React.PointerEvent) => {
    if (e.button !== 0 && e.pointerType === 'mouse') return

    // Don't hijack inputs, textareas, or buttons
    const target = e.target as HTMLElement
    if (target.tagName === 'INPUT' || target.tagName === 'TEXTAREA' || target.closest('button')) {
      return
    }

    isDraggingRef.current = true
    hasDraggedPastThresholdRef.current = false

    dragStartPointerRef.current = { x: e.clientX, y: e.clientY }
    dragStartPosRef.current = { ...posRef.current }
    pointerHistoryRef.current = [{ x: e.clientX, y: e.clientY, time: performance.now() }]

    if (rafIdRef.current !== null) {
      cancelAnimationFrame(rafIdRef.current)
      rafIdRef.current = null
    }

    const currentTarget = e.currentTarget as HTMLElement
    try {
      currentTarget.setPointerCapture(e.pointerId)
    } catch {
      // Fallback
    }

    setDragState((prev) => ({ ...prev, isDragging: true }))
  }, [])

  const handlePointerMove = useCallback(
    (e: React.PointerEvent) => {
      if (!isDraggingRef.current) return

      const rawDeltaX = e.clientX - dragStartPointerRef.current.x
      const rawDeltaY = e.clientY - dragStartPointerRef.current.y

      if (Math.hypot(rawDeltaX, rawDeltaY) > 5) {
        hasDraggedPastThresholdRef.current = true
      }

      const now = performance.now()
      pointerHistoryRef.current.push({ x: e.clientX, y: e.clientY, time: now })
      if (pointerHistoryRef.current.length > 5) {
        pointerHistoryRef.current.shift()
      }

      // Elastic rubber-banding resistance function
      const applyElasticResistance = (val: number, limit: number) => {
        const sign = Math.sign(val)
        const absVal = Math.abs(val)
        if (absVal <= limit) return val
        // Logarithmic soft resistance past the limit
        return sign * (limit + (absVal - limit) * 0.35)
      }

      const targetX = dragStartPosRef.current.x + rawDeltaX
      const targetY = dragStartPosRef.current.y + rawDeltaY

      const dampedX = applyElasticResistance(targetX, maxDistance)
      const dampedY = applyElasticResistance(targetY, maxDistance * 0.5)

      posRef.current = { x: dampedX, y: dampedY }

      setDragState({
        x: dampedX,
        y: dampedY,
        rotate: dampedX * rotationFactor,
        isDragging: true,
      })
    },
    [maxDistance, rotationFactor]
  )

  const handlePointerUp = useCallback(
    (e: React.PointerEvent) => {
      if (!isDraggingRef.current) return

      isDraggingRef.current = false

      try {
        const currentTarget = e.currentTarget as HTMLElement
        currentTarget.releasePointerCapture(e.pointerId)
      } catch {
        // Fallback
      }

      // Calculate release fling velocity
      const history = pointerHistoryRef.current
      if (history.length >= 2) {
        const oldest = history[0]
        const newest = history[history.length - 1]
        const dt = (newest.time - oldest.time) / 1000
        if (dt > 0.01) {
          const vx = (newest.x - oldest.x) / dt
          const vy = (newest.y - oldest.y) / dt
          velRef.current = {
            x: Math.max(Math.min(vx * 0.6, 900), -900),
            y: Math.max(Math.min(vy * 0.6, 600), -600),
          }
        }
      }

      // Start the smooth spring snapback
      startSpringLoop()
    },
    [startSpringLoop]
  )

  // Prevent click if user dragged past threshold
  const handleClickCapture = useCallback((e: React.MouseEvent) => {
    if (hasDraggedPastThresholdRef.current) {
      e.stopPropagation()
      e.preventDefault()
    }
  }, [])

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (rafIdRef.current !== null) {
        cancelAnimationFrame(rafIdRef.current)
      }
    }
  }, [])

  return {
    ...dragState,
    dragProps: {
      onPointerDown: handlePointerDown,
      onPointerMove: handlePointerMove,
      onPointerUp: handlePointerUp,
      onPointerCancel: handlePointerUp,
      onClickCapture: handleClickCapture,
    },
  }
}
