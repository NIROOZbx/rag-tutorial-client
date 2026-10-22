import { ArrowUp } from 'lucide-react'

interface ComposerProps {
  value: string
  onChange: (val: string) => void
  onSend: () => void
  disabled?: boolean
}

export function Composer({ value, onChange, onSend, disabled }: ComposerProps) {
  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' && !disabled && value.trim()) {
      onSend()
    }
  }

  return (
    <div className="w-full flex justify-center pb-[15px] px-4">
      {/* 
        Figma exact specs:
        - Width: 599px (Hug)
        - Height: 40.67px (Hug)
        - Padding: 15px horizontal, 10px vertical
        - Gap: 10px
        - Corner radius: 37px
        - Fill: #FFFFFF
        - Stroke: #CDCDCD, Weight: 0.5px (Inside)
      */}
      <div
        data-no-drag="true"
        onPointerDown={(e) => e.stopPropagation()}
        className="w-full max-w-[599px] min-h-[40.67px] rounded-[37px] bg-[#FFFFFF] border-[0.5px] border-[#CDCDCD] flex items-center justify-between px-[15px] py-[10px] gap-[10px] shadow-xs cursor-default"
      >
        <input
          type="text"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder="Send a messsage ..."
          disabled={disabled}
          className="w-full bg-transparent border-0 outline-none text-[16px] text-[#111827] placeholder:text-[#bebebe] leading-none disabled:cursor-not-allowed"
        />

        {/* Circular dark action button with up arrow */}
        <button
          onClick={onSend}
          disabled={disabled || !value.trim()}
          className="w-[24px] h-[24px] rounded-full bg-[#111827] text-white flex items-center justify-center shrink-0 transition hover:opacity-90 disabled:opacity-30 disabled:cursor-not-allowed"
          title="Send message"
        >
          <ArrowUp className="w-3.5 h-3.5 text-white stroke-[2.5]" />
        </button>
      </div>
    </div>
  )
}
