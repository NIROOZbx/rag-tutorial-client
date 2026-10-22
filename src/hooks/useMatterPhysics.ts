import { useEffect, useRef, useState, useCallback } from 'react'
import Matter from 'matter-js'

interface MatterPhysicsState {
  x: number
  y: number
  rotate: number
  isDragging: boolean
}

export function useMatterPhysics() {
  const [state, setState] = useState<MatterPhysicsState>({
    x: 0,
    y: 0,
    rotate: 0,
    isDragging: false,
  })

  // Matter engine references
  const engineRef = useRef<Matter.Engine | null>(null)
  const boardBodyRef = useRef<Matter.Body | null>(null)
  const mouseConstraintRef = useRef<Matter.Constraint | null>(null)
  const isDraggingRef = useRef(false)
  const rafIdRef = useRef<number | null>(null)

  // Target and smoothed mouse drag coordinates to eliminate pointer jitter
  const targetDragRef = useRef({ x: 0, y: 0 })
  const smoothedDragRef = useRef({ x: 0, y: 0 })

  // Function to run the physics loop when awake
  const stepPhysics = useCallback(() => {
    if (rafIdRef.current) return // Already running

    const loop = () => {
      const engine = engineRef.current
      const board = boardBodyRef.current

      if (!engine || !board) {
        rafIdRef.current = null
        return
      }

      // Smoothly interpolate drag constraint toward mouse pointer for buttery-smooth follow
      if (isDraggingRef.current && mouseConstraintRef.current) {
        smoothedDragRef.current.x +=
          (targetDragRef.current.x - smoothedDragRef.current.x) * 0.22
        smoothedDragRef.current.y +=
          (targetDragRef.current.y - smoothedDragRef.current.y) * 0.22

        mouseConstraintRef.current.pointA = {
          x: smoothedDragRef.current.x,
          y: smoothedDragRef.current.y,
        }
      }

      // Fixed 60Hz physics timestep prevents Euler integration micro-stutter
      Matter.Engine.update(engine, 1000 / 60)

      const posX = board.position.x
      const posY = board.position.y
      const rotDeg = (board.angle * 180) / Math.PI

      // Check if board has returned smoothly to rest position
      const isAtRest =
        !isDraggingRef.current &&
        Math.abs(posX) < 0.05 &&
        Math.abs(posY) < 0.05 &&
        Math.abs(rotDeg) < 0.03 &&
        Math.abs(board.velocity.x) < 0.015 &&
        Math.abs(board.velocity.y) < 0.015 &&
        Math.abs(board.angularVelocity) < 0.001

      if (isAtRest) {
        // Snap cleanly to rest position (0, 0, 0)
        Matter.Body.setPosition(board, { x: 0, y: 0 })
        Matter.Body.setAngle(board, 0)
        Matter.Body.setVelocity(board, { x: 0, y: 0 })
        Matter.Body.setAngularVelocity(board, 0)

        setState({
          x: 0,
          y: 0,
          rotate: 0,
          isDragging: false,
        })

        rafIdRef.current = null
        return // Sleep until next user interaction
      }

      setState({
        x: posX,
        y: posY,
        rotate: rotDeg,
        isDragging: isDraggingRef.current,
      })

      rafIdRef.current = requestAnimationFrame(loop)
    }

    rafIdRef.current = requestAnimationFrame(loop)
  }, [])

  // Initialize Matter.js world on mount
  useEffect(() => {
    const { Engine, Bodies, Composite, Constraint } = Matter

    // Zero gravity so board floats, suspended by elastic ropes/springs
    const engine = Engine.create({
      gravity: { x: 0, y: 0, scale: 0 },
    })
    engineRef.current = engine

    // Physical board body (1140 x 724, chamfered corners, tuned air resistance)
    const board = Bodies.rectangle(0, 0, 1140, 724, {
      chamfer: { radius: 51 },
      density: 0.003,
      frictionAir: 0.088, // Silky air damping
      restitution: 0.15,
    })
    boardBodyRef.current = board

    // Dual elastic suspension springs tuned for critically-damped smooth swing
    const springLeft = Constraint.create({
      pointA: { x: -350, y: 0 },
      bodyB: board,
      pointB: { x: -350, y: 0 },
      stiffness: 0.0055,
      damping: 0.08,
      length: 0,
    })

    const springRight = Constraint.create({
      pointA: { x: 350, y: 0 },
      bodyB: board,
      pointB: { x: 350, y: 0 },
      stiffness: 0.0055,
      damping: 0.08,
      length: 0,
    })

    const springCenter = Constraint.create({
      pointA: { x: 0, y: 0 },
      bodyB: board,
      pointB: { x: 0, y: 0 },
      stiffness: 0.0045,
      damping: 0.08,
      length: 0,
    })

    Composite.add(engine.world, [board, springLeft, springRight, springCenter])

    return () => {
      if (rafIdRef.current) cancelAnimationFrame(rafIdRef.current)
      Composite.clear(engine.world, false)
      Engine.clear(engine)
    }
  }, [])

  // Drag initiation handler: ONLY called when user grabs the outer board rim
  const handleRimPointerDown = useCallback(
    (e: React.PointerEvent) => {
      if (e.button !== 0 && e.pointerType === 'mouse') return

      // Strict check: if click originated inside chat frame or interactive element, ignore
      const target = e.target as HTMLElement | null
      if (
        !target ||
        target.closest('#chat-inner-workspace') ||
        target.closest('[data-no-drag="true"]') ||
        target.closest('input, textarea, button, [role="button"], a')
      ) {
        return
      }

      const engine = engineRef.current
      const board = boardBodyRef.current
      if (!engine || !board) return

      const pointerStartX = e.clientX
      const pointerStartY = e.clientY

      targetDragRef.current = { x: 0, y: 0 }
      smoothedDragRef.current = { x: 0, y: 0 }

      isDraggingRef.current = true
      setState((prev) => ({ ...prev, isDragging: true }))

      // Calculate local grab position on the board
      const rect = e.currentTarget.getBoundingClientRect()
      const centerX = rect.left + rect.width / 2
      const centerY = rect.top + rect.height / 2
      const localX = (e.clientX - centerX) * 0.85
      const localY = (e.clientY - centerY) * 0.85

      // Clean up any stale constraint
      if (mouseConstraintRef.current) {
        Matter.Composite.remove(engine.world, mouseConstraintRef.current)
        mouseConstraintRef.current = null
      }

      // Create dynamic Matter.js drag constraint with smooth damping
      const mouseConstraint = Matter.Constraint.create({
        pointA: { x: board.position.x, y: board.position.y },
        bodyB: board,
        pointB: { x: localX, y: localY },
        stiffness: 0.14,
        damping: 0.10,
        length: 0,
      })
      mouseConstraintRef.current = mouseConstraint
      Matter.Composite.add(engine.world, mouseConstraint)

      // Wake up the simulation loop
      stepPhysics()

      // Track pointer anywhere across the window so drag never gets stuck
      const handleWindowPointerMove = (ev: PointerEvent) => {
        if (!isDraggingRef.current) return
        targetDragRef.current = {
          x: ev.clientX - pointerStartX,
          y: ev.clientY - pointerStartY,
        }
      }

      const handleWindowPointerUp = () => {
        isDraggingRef.current = false
        window.removeEventListener('pointermove', handleWindowPointerMove)
        window.removeEventListener('pointerup', handleWindowPointerUp)
        window.removeEventListener('pointercancel', handleWindowPointerUp)

        if (engineRef.current && mouseConstraintRef.current) {
          Matter.Composite.remove(engineRef.current.world, mouseConstraintRef.current)
          mouseConstraintRef.current = null
        }

        // Keep loop running so board smoothly oscillates back to center rest position
        stepPhysics()
      }

      window.addEventListener('pointermove', handleWindowPointerMove)
      window.addEventListener('pointerup', handleWindowPointerUp)
      window.addEventListener('pointercancel', handleWindowPointerUp)
    },
    [stepPhysics]
  )

  return {
    ...state,
    handleRimPointerDown,
  }
}
