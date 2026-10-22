import robotImg from '../../assets/images/robot.png'

interface MascotProps {
  size?: 'sm' | 'lg'
  className?: string
}

export function Mascot({ size = 'lg', className = '' }: MascotProps) {
  const dimensionClass = size === 'sm' ? 'w-[34px] h-[34px]' : 'w-[72px] h-auto'

  return (
    <img
      src={robotImg}
      alt="Assistant Mascot"
      className={`${dimensionClass} pointer-events-none select-none transition-transform duration-300 ${className}`}
    />
  )
}
