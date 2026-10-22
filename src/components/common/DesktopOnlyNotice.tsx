import { Monitor } from 'lucide-react'
import { Mascot } from '../mascot/Mascot'

export function DesktopOnlyNotice() {
    return (
        <div className="min-h-screen w-full bg-white flex flex-col items-center justify-center px-6 py-12 text-center select-none">
            {/* Robot Mascot */}
            <div className="mb-6 flex flex-col items-center justify-center">
                <Mascot size="lg" />
            </div>

            {/* Speech Card / Notice Container */}
            <div className="relative bg-[#F4F4F4] rounded-[24px] max-w-[440px] w-full p-8 shadow-xs border border-[#E1E1E1] flex flex-col items-center">
                {/* Device Icon Badge */}
                <div className="w-12 h-12 rounded-full bg-[#8FDAF2] flex items-center justify-center text-white mb-4 shadow-xs">
                    <Monitor className="w-6 h-6 stroke-[2.2]" />
                </div>

                {/* Title */}
                <h2 className="text-[20px] font-semibold text-[#111827] mb-2 leading-tight">
                    Desktop Experience Only
                </h2>

                {/* Description */}
                <p className="text-[15px] text-[#7F7F7F] leading-relaxed">
                    This interactive hanging board application is built specifically for desktop displays.
                    Please open this page on a computer or expand your browser window to interact with it.
                </p>
            </div>
        </div>
    )
}

