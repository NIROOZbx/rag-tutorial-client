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
  const isDraggingRef = useRef(false)
  const rafIdRef = useRef<number | null>(null)

  // Direct 1:1 drag tracking references
  const dragStartPointerRef = useRef({ x: 0, y: 0 })
  const dragStartPosRef = useRef({ x: 0, y: 0, angle: 0 })
  const grabOffsetRef = useRef({ x: 0, y: 0 })
  const pointerHistoryRef = useRef<{ x: number; y: number; time: number }[]>([])

  // Physics animation loop for smooth spring snapback on release
  const runPhysicsLoop = useCallback(() => {
    if (rafIdRef.current) return

    let lastTime = performance.now()

    const loop = (now: number) => {
      const engine = engineRef.current
      const board = boardBodyRef.current

      if (!engine || !board) {
        rafIdRef.current = null
        return
      }

      // If user starts dragging again, direct manipulation takes over
      if (isDraggingRef.current) {
        rafIdRef.current = null
        return
      }

      const dt = Math.min((now - lastTime) / 1000, 0.033)
      lastTime = now

      // Step Matter.js simulation (elastic suspension return)
      Matter.Engine.update(engine, dt * 1000)

      const posX = board.position.x
      const posY = board.position.y
      const rotDeg = (board.angle * 180) / Math.PI

      // Check if board has smoothly settled at rest (0, 0, 0)
      const isAtRest =
        Math.abs(posX) < 0.05 &&
        Math.abs(posY) < 0.05 &&
        Math.abs(rotDeg) < 0.04 &&
        Math.abs(board.velocity.x) < 0.015 &&
        Math.abs(board.velocity.y) < 0.015 &&
        Math.abs(board.angularVelocity) < 0.001

      if (isAtRest) {
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
        return // Sleep until next interaction
      }

      setState({
        x: posX,
        y: posY,
        rotate: rotDeg,
        isDragging: false,
      })

      rafIdRef.current = requestAnimationFrame(loop)
    }

    rafIdRef.current = requestAnimationFrame(loop)
  }, [])

  // Initialize Matter.js world on mount
  useEffect(() => {
    const { Engine, Bodies, Composite, Constraint } = Matter

    const engine = Engine.create({
      gravity: { x: 0, y: 0, scale: 0 },
    })
    engineRef.current = engine

    const board = Bodies.rectangle(0, 0, 1140, 724, {
      chamfer: { radius: 51 },
      density: 0.003,
      frictionAir: 0.075,
      restitution: 0.15,
    })
    boardBodyRef.current = board

    // Dual elastic suspension springs that pull the board gently back to rest position (0, 0)
    const springLeft = Constraint.create({
      pointA: { x: -350, y: 0 },
      bodyB: board,
      pointB: { x: -350, y: 0 },
      stiffness: 0.0065,
      damping: 0.065,
      length: 0,
    })

    const springRight = Constraint.create({
      pointA: { x: 350, y: 0 },
      bodyB: board,
      pointB: { x: 350, y: 0 },
      stiffness: 0.0065,
      damping: 0.065,
      length: 0,
    })

    const springCenter = Constraint.create({
      pointA: { x: 0, y: 0 },
      bodyB: board,
      pointB: { x: 0, y: 0 },
      stiffness: 0.005,
      damping: 0.065,
      length: 0,
    })

    Composite.add(engine.world, [board, springLeft, springRight, springCenter])

    return () => {
      if (rafIdRef.current) cancelAnimationFrame(rafIdRef.current)
      Composite.clear(engine.world, false)
      Engine.clear(engine)
    }
  }, [])

  // Drag initiation handler: responds 1:1 exactly as dragged, ZERO jump on touch
  const handleBoardPointerDown = useCallback(
    (e: React.PointerEvent) => {
      if (e.button !== 0 && e.pointerType === 'mouse') return

      const target = e.target as HTMLElement | null
      if (
        !target ||
        target.closest('[data-no-drag="true"]') ||
        target.closest('input, textarea, select, button, [role="button"], a')
      ) {
        return
      }

      const board = boardBodyRef.current
      if (!board) return

      // Exactly record starting state - NO INITIAL JUMP OR DROP
      isDraggingRef.current = true
      dragStartPointerRef.current = { x: e.clientX, y: e.clientY }
      dragStartPosRef.current = {
        x: board.position.x,
        y: board.position.y,
        angle: board.angle,
      }

      const rect = e.currentTarget.getBoundingClientRect()
      const centerX = rect.left + rect.width / 2
      const centerY = rect.top + rect.height / 2
      grabOffsetRef.current = {
        x: e.clientX - centerX,
        y: e.clientY - centerY,
      }

      pointerHistoryRef.current = [
        { x: e.clientX, y: e.clientY, time: performance.now() },
      ]

      setState((prev) => ({ ...prev, isDragging: true }))

      // Track window pointer move: 1:1 immediate response
      const handleWindowPointerMove = (ev: PointerEvent) => {
        if (!isDraggingRef.current || !boardBodyRef.current) return

        const deltaX = ev.clientX - dragStartPointerRef.current.x
        const deltaY = ev.clientY - dragStartPointerRef.current.y

        // 1:1 exact movement following the mouse
        const newX = dragStartPosRef.current.x + deltaX
        const newY = dragStartPosRef.current.y + deltaY

        // Natural subtle hanging tilt based on lateral drag and grab point
        const swayAngleRad = (deltaX * 0.03 * Math.PI) / 180
        const torqueAngleRad =
          ((grabOffsetRef.current.x / 500) * deltaY * 0.018 * Math.PI) / 180
        const rawAngle = dragStartPosRef.current.angle + swayAngleRad + torqueAngleRad
        const maxAngleRad = (14 * Math.PI) / 180
        const newAngle = Math.max(-maxAngleRad, Math.min(maxAngleRad, rawAngle))

        // Update physical body position directly so it syncs with mouse
        Matter.Body.setPosition(boardBodyRef.current, { x: newX, y: newY })
        Matter.Body.setAngle(boardBodyRef.current, newAngle)

        // Record recent pointer history to calculate throw/release momentum
        const now = performance.now()
        pointerHistoryRef.current.push({ x: ev.clientX, y: ev.clientY, time: now })
        if (pointerHistoryRef.current.length > 5) {
          pointerHistoryRef.current.shift()
        }

        // Instant visual update without lag
        setState({
          x: newX,
          y: newY,
          rotate: (newAngle * 180) / Math.PI,
          isDragging: true,
        })
      }

      const handleWindowPointerUp = () => {
        isDraggingRef.current = false
        window.removeEventListener('pointermove', handleWindowPointerMove)
        window.removeEventListener('pointerup', handleWindowPointerUp)
        window.removeEventListener('pointercancel', handleWindowPointerUp)

        const board = boardBodyRef.current
        if (board) {
          // Calculate release velocity from recent pointer positions
          const history = pointerHistoryRef.current
          if (history.length >= 2) {
            const first = history[0]
            const last = history[history.length - 1]
            const dt = Math.max((last.time - first.time) / 1000, 0.016)
            const vx = Math.max(-25, Math.min(25, ((last.x - first.x) / dt) * 0.012))
            const vy = Math.max(-25, Math.min(25, ((last.y - first.y) / dt) * 0.012))
            Matter.Body.setVelocity(board, { x: vx, y: vy })
          }

          // Let Matter.js springs smoothly pull the board back to rest
          runPhysicsLoop()
        }
      }

      window.addEventListener('pointermove', handleWindowPointerMove)
      window.addEventListener('pointerup', handleWindowPointerUp)
      window.addEventListener('pointercancel', handleWindowPointerUp)
    },
    [runPhysicsLoop]
  )

  return {
    ...state,
    handleBoardPointerDown,
  }
}
