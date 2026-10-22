import type { ReactNode } from 'react'
import noiseImg from '../../assets/images/noise.png'

interface SurroundBoardProps {
  children: ReactNode
  onPointerDown?: (e: React.PointerEvent) => void
  isDragging?: boolean
}

export function SurroundBoard({
  children,
  onPointerDown,
  isDragging = false,
}: SurroundBoardProps) {
  return (
    <div
      className="relative z-10 w-full max-w-[1140px] px-3 sm:px-0"
      style={{
        height: '724px',
        maxHeight: '724px',
      }}
    >
      {/* 
        Outer surround: 1140 x 724, 51px radius, 59deg gradient, 25px inset rim with textured noise.
        Dragging can be initiated from the outer rim, header, or empty workspace background!
      */}
      <div
        onPointerDown={onPointerDown}
        className={`relative w-full rounded-[51px] p-[25px] overflow-hidden select-none touch-none ${
          isDragging ? 'cursor-grabbing' : 'cursor-grab'
        }`}
        style={{
          background: 'linear-gradient(59deg, #8FDAF2 0%, #C9E8F2 35%, #98DFF5 66%, #DFF8FF 100%)',
          height: '724px',
          maxHeight: '724px',
        }}
      >
        {/* Figma Textured Gradient Noise: Mono, Noise size X 0.5 Y 0.5, Density 100%, Color #000000 25% */}
        <div
          className="absolute inset-0 pointer-events-none rounded-[51px]"
          style={{
            backgroundImage: `url(${noiseImg})`,
            backgroundRepeat: 'repeat',
            backgroundSize: '128px 128px',
            opacity: 0.25,
            mixBlendMode: 'multiply',
          }}
        />

        {/* 
          Inner Chat Frame Workspace:
          Allows dragging from header and empty space, while keeping interactive elements protected.
        */}
        <div
          id="chat-inner-workspace"
          className="relative z-10 w-full h-full select-auto touch-auto"
        >
          {children}
        </div>
      </div>
    </div>
  )
}
