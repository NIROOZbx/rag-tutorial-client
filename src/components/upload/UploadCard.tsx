import { UploadCloud, Loader2 } from 'lucide-react'
import { Mascot } from '../mascot/Mascot'

interface UploadCardProps {
  onBrowseClick: () => void
  isUploading?: boolean
}

export function UploadCard({ onBrowseClick, isUploading = false }: UploadCardProps) {
  return (
    <div
      onClick={isUploading ? undefined : onBrowseClick}
      className={`flex flex-col items-center justify-center my-auto transition select-none ${
        isUploading ? 'cursor-wait opacity-90' : 'cursor-pointer'
      }`}
    >
      {/* Upload Card: 254 x 89, radius 10px, flat white with subtle shadow */}
      <div
        role="button"
        tabIndex={0}
        onKeyDown={(e) => {
          if ((e.key === 'Enter' || e.key === ' ') && !isUploading) {
            e.preventDefault()
            onBrowseClick()
          }
        }}
        className={`relative bg-white rounded-[10px] w-[254px] h-[89px] flex flex-col items-center justify-center text-center px-6 transition shadow-xs group ${
          isUploading ? 'cursor-wait' : 'hover:scale-[1.01] active:scale-[0.99]'
        }`}
      >
        {/* Header line inside card */}
        <div className="flex items-center gap-1.5 mb-1.5">
          <div className="w-5 h-5 rounded-full bg-[#8FDAF2] flex items-center justify-center text-white">
            {isUploading ? (
              <Loader2 className="w-3 h-3 text-white stroke-[2.5] animate-spin" />
            ) : (
              <UploadCloud className="w-3 h-3 text-white stroke-[2.2]" />
            )}
          </div>
          <span className="text-sm font-medium text-[#7F7F7F]">
            {isUploading ? 'Processing PDF...' : 'Drop your file'}
          </span>
        </div>

        {/* Subtitle */}
        <span className="text-xs text-tertiary">
          {isUploading ? 'Extracting & storing chunks...' : 'PDF only · Maximum file size: 10 MB'}
        </span>

        {/* Speech bubble pointer pointing down to the robot */}
        <div className="absolute -bottom-2 left-1/2 -translate-x-1/2 w-0 h-0 border-l-[6px] border-l-transparent border-r-[6px] border-r-transparent border-t-[8px] border-t-white" />
      </div>

      {/* Mascot Robot: 72px */}
      <div className="mt-1 flex justify-center">
        <Mascot size="lg" />
      </div>
    </div>
  )
}
