import { RotateCcw, AlertCircle } from 'lucide-react'
import { Mascot } from '../mascot/Mascot'

interface ErrorCardProps {
  onRetry: () => void
  errorMessage?: string
}

export function ErrorCard({ onRetry, errorMessage }: ErrorCardProps) {
  // Determine clean, non-repetitive diagnostic message
  let primaryReason = 'An internal server error occurred.'
  let secondaryHint = 'Please try uploading your PDF again.'

  if (errorMessage) {
    if (
      errorMessage.includes('port 8080') ||
      errorMessage.includes('Cannot connect') ||
      errorMessage.includes('backend server')
    ) {
      primaryReason = 'Cannot connect to backend server.'
      secondaryHint = 'Please make sure your Go server is running on port 8080.'
    } else if (
      errorMessage.includes('10 MB') ||
      errorMessage.includes('too large')
    ) {
      primaryReason = 'File exceeds the 10 MB limit.'
      secondaryHint = 'Please choose a smaller PDF under 10 MB.'
    } else if (
      errorMessage.includes('Only PDF') ||
      errorMessage.includes('password') ||
      errorMessage.includes('corrupted')
    ) {
      primaryReason = 'Invalid or unreadable PDF.'
      secondaryHint = 'Please check that the file is not corrupted or password-protected.'
    } else {
      // Default clean message: avoids confusing duplicates like "PDF processing failed"
      primaryReason = 'An internal server error occurred.'
      secondaryHint = 'Please try uploading your PDF again.'
    }
  }

  return (
    <div
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
        {/* Header: Error badge + Single Title */}
        <div className="flex items-center gap-2 mb-3">
          <div className="w-[22px] h-[22px] rounded-full bg-[#FEF2F2] border border-[#FECACA] flex items-center justify-center shrink-0">
            <AlertCircle className="w-3.5 h-3.5 text-[#EF4444] stroke-[2.2]" />
          </div>
          <span className="text-[17px] font-medium text-[#111827]">
            PDF upload failed
          </span>
        </div>

        {/* Message body: clean and concise, no duplicate "processing failed" */}
        <div className="text-sm leading-[1.45] text-center mb-5 px-1 text-[#6B7280]">
          <p>{primaryReason}</p>
          <p className="mt-0.5">{secondaryHint}</p>
        </div>

        {/* Retry Button */}
        <button
          onClick={onRetry}
          className="h-[38px] rounded-full bg-[#111827] text-white text-sm font-medium flex items-center justify-center gap-2 px-5 transition hover:bg-[#111827]/90 active:scale-95 cursor-pointer shadow-xs"
        >
          <RotateCcw className="w-3.5 h-3.5 text-white stroke-[2.5]" />
          <span>Retry upload</span>
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
