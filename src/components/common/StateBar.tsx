import type { ScreenState } from '../../types/chat'

interface StateBarProps {
  currentState: ScreenState
  onStateChange: (state: ScreenState) => void
}

export function StateBar({ currentState, onStateChange }: StateBarProps) {
  const states: { key: ScreenState; label: string }[] = [
    { key: 'upload', label: '01 Upload (Idle)' },
    { key: 'conversation', label: '02 Conversation' },
    { key: 'error', label: '03 Upload Failed' },
  ]

  return (
    <div className="z-50 mb-6 flex items-center gap-1.5 p-1 rounded-full bg-[#F4F4F4] border border-[#D1D5DB] text-xs">
      {states.map(({ key, label }) => {
        const isActive = currentState === key
        return (
          <button
            key={key}
            onClick={() => onStateChange(key)}
            className={`px-3 py-1 rounded-full font-medium transition ${
              isActive
                ? 'bg-[#111827] text-white'
                : 'text-[#7F7F7F] hover:text-[#111827]'
            }`}
          >
            {label}
          </button>
        )
      })}
    </div>
  )
}
