import { Loader, X } from 'lucide-react'
import { Mascot } from '../mascot/Mascot'
import pdfIcon from '../../assets/Group 2.svg'

interface UploadProgressCardProps {
  fileName: string
  fileSize: number
  progress: number // 0 to 100
  onCancel?: () => void
}

function formatBytes(bytes: number): string {
  if (bytes <= 0) return '0 KB'
  const kb = bytes / 1024
  if (kb < 1000) {
    return `${Math.round(kb)} KB`
  }
  const mb = kb / 1024
  return `${mb.toFixed(1)} MB`
}

export function UploadProgressCard({
  fileName,
  fileSize,
  progress,
  onCancel,
}: UploadProgressCardProps) {
  const clampedProgress = Math.min(100, Math.max(0, progress))
  const uploadedBytes = Math.round((clampedProgress / 100) * fileSize)
  const isFinished = clampedProgress >= 100

  return (
    <div className="flex flex-col items-center justify-center my-auto select-none">
      {/* 
        Progress State Card:
        Matches exact reference design:
        - PDF icon with red badge (from Group 2.svg)
        - File name + progress bytes + radial spinner + "Uploading..."
        - Close / cancel button
        - Vibrant blue progress bar (#2563EB)
        - Pure white card, no border, 18px rounded corners, shadow-xs
      */}
      <div className="relative bg-white rounded-[18px] w-[390px] max-w-[90vw] p-5 shadow-xs">
        {/* Top Content Row */}
        <div className="flex items-center justify-between gap-3">
          {/* Left: Document icon with red PDF badge */}
          <div className="w-[38px] h-[40px] shrink-0 flex items-center justify-center">
            <img
              src={pdfIcon}
              alt="PDF Icon"
              className="w-full h-full object-contain"
            />
          </div>

          {/* Middle: File info & status */}
          <div className="flex-1 min-w-0 pr-1">
            <h4 className="text-[15px] font-semibold text-[#111827] truncate leading-tight">
              {fileName}
            </h4>
            <div className="flex items-center gap-1.5 text-[13px] text-[#6B7280] mt-1 leading-none">
              <span>
                {formatBytes(uploadedBytes)} of {formatBytes(fileSize)}
              </span>
              <span>·</span>
              <Loader className="w-3.5 h-3.5 text-[#2563EB] animate-spin inline-block shrink-0 stroke-[2.2]" />
              <span className="truncate">
                {isFinished ? 'Processing...' : 'Uploading...'}
              </span>
            </div>
          </div>

          {/* Right: Cancel button */}
          {onCancel && (
            <button
              onClick={onCancel}
              className="p-1 rounded-full text-[#9CA3AF] hover:text-[#4B5563] hover:bg-gray-100 transition shrink-0 cursor-pointer"
              title="Cancel upload"
            >
              <X className="w-4 h-4 stroke-[2]" />
            </button>
          )}
        </div>

        {/* Bottom: Blue Progress Bar */}
        <div className="w-full bg-[#E5E7EB] h-[6px] rounded-full overflow-hidden mt-4">
          <div
            className="bg-[#2563EB] h-full rounded-full transition-all duration-300 ease-out"
            style={{ width: `${clampedProgress}%` }}
          />
        </div>

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
