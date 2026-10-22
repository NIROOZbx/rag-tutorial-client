import { useState, useRef, useEffect, useCallback } from 'react'

interface UseHangingPhysicsOptions {
  /** Effective pendulum length in pixels (from pivot at y=0 to center of mass) */
  length?: number
  /** Gravity / restoring acceleration coefficient */
  gravity?: number
  /** Velocity damping per frame (0 to 1, higher = longer swing) */
  damping?: number
  /** Maximum swing angle in degrees to prevent unnatural flips */
  maxAngle?: number
  /** Enable subtle welcome swing on initial mount */
  welcomeSwing?: boolean
}

export function useHangingPhysics({
  length = 480,
  gravity = 9.8,
  damping = 0.985,
  maxAngle = 18,
  welcomeSwing = true,
}: UseHangingPhysicsOptions = {}) {
  // Current rotation angle in degrees
  const [angle, setAngle] = useState(0)
  const [wobble, setWobble] = useState(0) // lateral bowing displacement in px
  const [isDragging, setIsDragging] = useState(false)

  // Mutable animation state references to avoid React render cycle lags in physics loop
  const angleRef = useRef(0)
  const velocityRef = useRef(0) // deg/s
  const wobbleRef = useRef(0)
  const wobbleVelRef = useRef(0)
  const isDraggingRef = useRef(false)
  const rafIdRef = useRef<number | null>(null)
  const lastTimeRef = useRef<number | null>(null)

  // Drag tracking refs
  const dragStartPointerRef = useRef({ x: 0, y: 0 })
  const dragStartAngleRef = useRef(0)
  const hasDraggedPastThresholdRef = useRef(false)
  const pointerHistoryRef = useRef<Array<{ x: number; time: number }>>([])
  const containerRef = useRef<HTMLDivElement | null>(null)

  // Physics animation loop
  const startPhysicsLoop = useCallback(() => {
    if (rafIdRef.current !== null) return

    lastTimeRef.current = performance.now()

    const step = (now: number) => {
      if (isDraggingRef.current) {
        rafIdRef.current = null
        return
      }

      const dt = Math.min((now - (lastTimeRef.current || now)) / 1000, 0.033) // Cap at ~30Hz delta
      lastTimeRef.current = now

      const currentAngleRad = (angleRef.current * Math.PI) / 180

      // Pendulum restoring torque: alpha = -(g / L) * sin(theta) [rad/s^2]
      const omegaAlpha = -((gravity * 120) / length) * Math.sin(currentAngleRad)
      const alphaDeg = (omegaAlpha * 180) / Math.PI

      // Integrate velocity and apply smooth air damping
      velocityRef.current = (velocityRef.current + alphaDeg * dt) * Math.pow(damping, dt * 60)
      angleRef.current += velocityRef.current * dt

      // Secondary Rope Wobble Spring: reacts to board velocity and acceleration
      const targetWobble = Math.max(-15, Math.min(15, -velocityRef.current * 0.12))
      const wobbleForce = (targetWobble - wobbleRef.current) * 45
      wobbleVelRef.current = (wobbleVelRef.current + wobbleForce * dt) * 0.92
      wobbleRef.current += wobbleVelRef.current * dt

      // Rest condition: when angle and velocity are negligible, stop loop
      if (Math.abs(angleRef.current) < 0.015 && Math.abs(velocityRef.current) < 0.03 && Math.abs(wobbleRef.current) < 0.05) {
        angleRef.current = 0
        velocityRef.current = 0
        wobbleRef.current = 0
        wobbleVelRef.current = 0
        setAngle(0)
        setWobble(0)
        rafIdRef.current = null
        return
      }

      setAngle(angleRef.current)
      setWobble(wobbleRef.current)
      rafIdRef.current = requestAnimationFrame(step)
    }

    rafIdRef.current = requestAnimationFrame(step)
  }, [gravity, length, damping])

  // Trigger gentle impulse
  const pushImpulse = useCallback(
    (degrees: number) => {
      velocityRef.current += degrees * 8
      startPhysicsLoop()
    },
    [startPhysicsLoop]
  )

  // Pointer drag event handlers
  const handlePointerDown = useCallback((e: React.PointerEvent) => {
    // Only drag with primary mouse button or touch
    if (e.button !== 0 && e.pointerType === 'mouse') return

    // Don't hijack focus inside inputs, buttons, or textareas unless dragging outside
    const target = e.target as HTMLElement
    if (target.tagName === 'INPUT' || target.tagName === 'TEXTAREA' || target.closest('button')) {
      return
    }

    isDraggingRef.current = true
    hasDraggedPastThresholdRef.current = false
    setIsDragging(true)

    dragStartPointerRef.current = { x: e.clientX, y: e.clientY }
    dragStartAngleRef.current = angleRef.current
    pointerHistoryRef.current = [{ x: e.clientX, time: performance.now() }]

    // Stop current physics loop while user holds the board
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
  }, [])

  const handlePointerMove = useCallback(
    (e: React.PointerEvent) => {
      if (!isDraggingRef.current) return

      const deltaX = e.clientX - dragStartPointerRef.current.x
      const deltaY = e.clientY - dragStartPointerRef.current.y
      const dist = Math.hypot(deltaX, deltaY)

      if (dist > 5) {
        hasDraggedPastThresholdRef.current = true
      }

      const now = performance.now()
      pointerHistoryRef.current.push({ x: e.clientX, time: now })
      if (pointerHistoryRef.current.length > 5) {
        pointerHistoryRef.current.shift()
      }

      // Calculate new angle from mouse displacement relative to pendulum length
      const deltaAngle = (Math.atan2(deltaX, length) * 180) / Math.PI
      let nextAngle = dragStartAngleRef.current + deltaAngle

      // Soft clamp max angle
      if (nextAngle > maxAngle) {
        nextAngle = maxAngle + (nextAngle - maxAngle) * 0.25
      } else if (nextAngle < -maxAngle) {
        nextAngle = -maxAngle + (nextAngle - -maxAngle) * 0.25
      }

      // Drag velocity gives instantaneous dynamic rope flex
      const lastPoint = pointerHistoryRef.current[pointerHistoryRef.current.length - 2]
      if (lastPoint) {
        const pdt = Math.max((now - lastPoint.time) / 1000, 0.005)
        const pvx = (e.clientX - lastPoint.x) / pdt
        wobbleRef.current = Math.max(-14, Math.min(14, -pvx * 0.015))
        setWobble(wobbleRef.current)
      }

      angleRef.current = nextAngle
      setAngle(nextAngle)
    },
    [length, maxAngle]
  )

  const handlePointerUp = useCallback(
    (e: React.PointerEvent) => {
      if (!isDraggingRef.current) return

      isDraggingRef.current = false
      setIsDragging(false)

      try {
        const currentTarget = e.currentTarget as HTMLElement
        currentTarget.releasePointerCapture(e.pointerId)
      } catch {
        // Fallback
      }

      // Calculate release velocity from recent pointer movements
      const history = pointerHistoryRef.current
      if (history.length >= 2) {
        const oldest = history[0]
        const newest = history[history.length - 1]
        const dt = (newest.time - oldest.time) / 1000
        if (dt > 0.01) {
          const vx = (newest.x - oldest.x) / dt // px/s
          const flingOmega = ((vx / length) * 180) / Math.PI
          velocityRef.current = Math.max(Math.min(flingOmega * 0.7, 120), -120)
        }
      }

      // Resume natural physics swinging
      startPhysicsLoop()
    },
    [length, startPhysicsLoop]
  )

  // Prevent accidental click triggers if user dragged past threshold
  const handleClickCapture = useCallback((e: React.MouseEvent) => {
    if (hasDraggedPastThresholdRef.current) {
      e.stopPropagation()
      e.preventDefault()
    }
  }, [])

  // Gentle welcome sway on mount
  useEffect(() => {
    if (welcomeSwing) {
      // Small delayed gentle sway
      const timer = setTimeout(() => {
        angleRef.current = 1.8
        velocityRef.current = 0
        setAngle(1.8)
        startPhysicsLoop()
      }, 400)
      return () => clearTimeout(timer)
    }
  }, [welcomeSwing, startPhysicsLoop])

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (rafIdRef.current !== null) {
        cancelAnimationFrame(rafIdRef.current)
      }
    }
  }, [])

  return {
    angle,
    wobble,
    isDragging,
    containerRef,
    pushImpulse,
    dragProps: {
      onPointerDown: handlePointerDown,
      onPointerMove: handlePointerMove,
      onPointerUp: handlePointerUp,
      onPointerCancel: handlePointerUp,
      onClickCapture: handleClickCapture,
    },
  }
}
