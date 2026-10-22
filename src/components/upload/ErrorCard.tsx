import { RotateCcw, FolderOpen, AlertCircle } from 'lucide-react'
import { Mascot } from '../mascot/Mascot'
import { ERROR_COPY, type UploadErrorCode } from '../../types/errors'

interface ErrorCardProps {
  onRetry: () => void
  onChooseFile?: () => void
  code?: UploadErrorCode
}

export function ErrorCard({ onRetry, onChooseFile, code = 'UNKNOWN' }: ErrorCardProps) {
  const { title, reason, hint, retryable, actionLabel } = ERROR_COPY[code] || ERROR_COPY.UNKNOWN

  const handleClick = () => {
    if (retryable) {
      onRetry()
    } else if (onChooseFile) {
      onChooseFile()
    } else {
      onRetry()
    }
  }

  return (
    <div
      role="alert"
      aria-live="assertive"
      data-no-drag="true"
      onPointerDown={(e) => e.stopPropagation()}
      className="flex flex-col items-center justify-center my-auto select-none cursor-default"
    >
      {/* 
        Failed State Card:
        - Pure white background, no border
        - 20px rounded corners with subtle shadow
        - Downward speech bubble pointer pointing to the mascot robot
      */}
      <div className="relative bg-white rounded-[20px] w-[390px] max-w-[90vw] py-[26px] px-[28px] flex flex-col items-center justify-center text-center shadow-xs">
        {/* Header: Error badge + Title */}
        <div className="flex items-center gap-2 mb-2">
          <div className="w-[22px] h-[22px] rounded-full bg-[#FEF2F2] border border-[#FECACA] flex items-center justify-center shrink-0">
            <AlertCircle className="w-3.5 h-3.5 text-[#EF4444] stroke-[2.2]" />
          </div>
          <span className="text-[17px] font-medium text-[#111827]">
            {title}
          </span>
        </div>

        {/* Message body: user-actionable explanation & guidance */}
        <div className="text-sm leading-[1.45] text-center mb-5 px-1 text-[#6B7280]">
          <p>{reason}</p>
          <p className="mt-0.5">{hint}</p>
        </div>

        {/* Action Button: dynamic based on retryability with tactile top/bottom inset bevel shadows */}
        <button
          onClick={handleClick}
          style={{
            boxShadow:
              'inset 2px 2px 2px rgba(255, 255, 255, 0.2), inset 0 2px 2px rgba(255, 255, 255, 0.15), inset -2px -2px 2px rgba(0, 0, 0, 0.35), inset 0 -2px 2px rgba(0, 0, 0, 0.35)',
          }}
          className="h-[38px] rounded-full bg-[#111827] text-white text-sm font-medium flex items-center justify-center gap-2 px-5 transition hover:bg-[#111827]/90 active:scale-95 cursor-pointer"
        >
          {retryable ? (
            <RotateCcw className="w-3.5 h-3.5 text-white stroke-[2.5]" />
          ) : (
            <FolderOpen className="w-3.5 h-3.5 text-white stroke-[2.5]" />
          )}
          <span>{actionLabel}</span>
        </button>

        {/* Speech bubble pointer pointing down to the robot */}
        <div className="absolute -bottom-2 left-1/2 -translate-x-1/2 w-0 h-0 border-l-[7px] border-l-transparent border-r-[7px] border-r-transparent border-t-[8px] border-t-white" />
      </div>

      {/* Mascot Robot */}
      <div className="mt-2 flex justify-center">
        <Mascot size="lg" />
      </div>
    </div>
  )
}
