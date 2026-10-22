import ropeImg from '../../assets/images/rope.png'

export function HangingRopes() {
  return (
    <>
      {/* Left Rope: 98px from board left edge, from top: 0 to board top edge (y=220px) */}
      <div
        className="absolute top-0 left-[98px] w-[36px] h-[220px] z-0 pointer-events-none"
        style={{
          backgroundImage: `url(${ropeImg})`,
          backgroundSize: '36px auto',
          backgroundRepeat: 'repeat-y',
        }}
      />

      {/* Right Rope: 98px from board right edge, from top: 0 to board top edge (y=220px) */}
      <div
        className="absolute top-0 right-[98px] w-[36px] h-[220px] z-0 pointer-events-none"
        style={{
          backgroundImage: `url(${ropeImg})`,
          backgroundSize: '36px auto',
          backgroundRepeat: 'repeat-y',
        }}
      />
    </>
  )
}
