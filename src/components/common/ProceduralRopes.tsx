import { useMemo } from 'react'

interface ProceduralRopesProps {
  /** Board horizontal displacement from Matter.js */
  x: number
  /** Board vertical displacement from Matter.js */
  y: number
  /** Board rotation angle in degrees from Matter.js */
  rotate: number
  /** Container width (default 1140) */
  containerWidth?: number
  /** Rope stroke width (default 6) */
  strokeWidth?: number
}

interface RopePathData {
  d: string
  topX: number
  topY: number
  bottomX: number
  bottomY: number
}

export function ProceduralRopes({
  x,
  y,
  rotate,
  containerWidth = 1140,
  strokeWidth = 6.5,
}: ProceduralRopesProps) {
  // Convert rotation to radians
  const rad = (rotate * Math.PI) / 180
  const cos = Math.cos(rad)
  const sin = Math.sin(rad)

  // Board center coordinate in stage space:
  // Layout center: x = containerWidth / 2 = 570, y = 220 + 724 / 2 = 582
  const centerX = containerWidth / 2 + x
  const centerY = 220 + 362 + y

  // Calculate left and right anchor points on the board's top rim:
  // Left local anchor: dx = -472, dy = -362
  // Right local anchor: dx = +472, dy = -362
  const leftBottomX = centerX + (-472 * cos - -362 * sin)
  const leftBottomY = centerY + (-472 * sin + -362 * cos)

  const rightBottomX = centerX + (472 * cos - -362 * sin)
  const rightBottomY = centerY + (472 * sin + -362 * cos)

  // Ceiling anchor points (pinned at y = 0)
  const leftTopX = 98
  const leftTopY = 0

  const rightTopX = containerWidth - 98
  const rightTopY = 0

  // Calculate catenary curve / Bezier path for a rope
  const calculateRopePath = (
    x0: number,
    y0: number,
    x1: number,
    y1: number
  ): RopePathData => {
    const dist = Math.hypot(x1 - x0, y1 - y0)
    const restLength = 220

    // Natural sag occurs if the board moves upward (slack rope)
    const slackSag = Math.max(0, (restLength - dist) * 0.75)

    // Dynamic horizontal inertia lag based on sideways displacement
    const lateralLag = (x1 - x0) * 0.12

    // Control point for smooth quadratic Bezier curve
    const cx = (x0 + x1) / 2 + lateralLag
    const cy = (y0 + y1) / 2 + slackSag

    return {
      d: `M ${x0} ${y0} Q ${cx} ${cy} ${x1} ${y1}`,
      topX: x0,
      topY: y0,
      bottomX: x1,
      bottomY: y1,
    }
  }

  const leftRope = useMemo(
    () => calculateRopePath(leftTopX, leftTopY, leftBottomX, leftBottomY),
    [leftTopX, leftTopY, leftBottomX, leftBottomY]
  )

  const rightRope = useMemo(
    () => calculateRopePath(rightTopX, rightTopY, rightBottomX, rightBottomY),
    [rightTopX, rightTopY, rightBottomX, rightBottomY]
  )

  return (
    <svg
      className="absolute top-0 left-0 w-full pointer-events-none z-0 overflow-visible"
      style={{
        height: '960px',
      }}
      viewBox={`0 0 ${containerWidth} 960`}
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
    >
      <defs>
        {/* Soft Ambient Depth Shadow */}
        <filter id="ropeSubtleShadow" x="-30%" y="-10%" width="160%" height="130%">
          <feDropShadow dx="0" dy="4" stdDeviation="3.5" floodColor="#000000" floodOpacity="0.12" />
        </filter>
      </defs>

      {/* RENDER BOTH DETAILED BLACK ROPES */}
      {[leftRope, rightRope].map((rope, idx) => (
        <g key={idx} filter="url(#ropeSubtleShadow)">
          {/* Layer 1: Solid Deep Black Base Cord */}
          <path
            d={rope.d}
            stroke="#111827"
            strokeWidth={strokeWidth}
            strokeLinecap="round"
          />

          {/* Layer 2: Subtle Woven Paracord Weave Texture */}
          <path
            d={rope.d}
            stroke="#27272A"
            strokeWidth={strokeWidth - 1.5}
            strokeDasharray="4 4.5"
            strokeLinecap="butt"
            strokeOpacity="0.8"
          />

          {/* Layer 3: Delicate Cylindrical Specular Light Reflection */}
          <path
            d={rope.d}
            stroke="#FFFFFF"
            strokeWidth="1"
            strokeDasharray="7 12"
            strokeLinecap="round"
            strokeOpacity="0.22"
          />

          {/* Ceiling Hardware Pin (y = 0) */}
          <g>
            <rect
              x={rope.topX - 7}
              y={rope.topY - 1}
              width="14"
              height="8"
              rx="2"
              fill="#18181B"
              stroke="#3F3F46"
              strokeWidth="0.5"
            />
            {/* Center Rivet */}
            <circle
              cx={rope.topX}
              cy={rope.topY + 3}
              r="1.2"
              fill="#71717A"
            />
          </g>

          {/* Board Rim Mounting Clamp (moves and tilts with board) */}
          <g transform={`rotate(${rotate} ${rope.bottomX} ${rope.bottomY})`}>
            <rect
              x={rope.bottomX - 7}
              y={rope.bottomY - 6}
              width="14"
              height="10"
              rx="2.5"
              fill="#18181B"
              stroke="#3F3F46"
              strokeWidth="0.5"
            />
            <line
              x1={rope.bottomX - 4}
              y1={rope.bottomY - 1}
              x2={rope.bottomX + 4}
              y2={rope.bottomY - 1}
              stroke="#52525B"
              strokeWidth="0.75"
            />
          </g>
        </g>
      ))}
    </svg>
  )
}
