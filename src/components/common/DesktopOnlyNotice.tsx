import { useState, useEffect } from 'react'
import { Monitor } from 'lucide-react'
import { Mascot } from '../mascot/Mascot'

export function DesktopOnlyNotice() {
    const [windowWidth, setWindowWidth] = useState<number>(
        typeof window !== 'undefined' ? window.innerWidth : 0
    )

    useEffect(() => {
        const handleResize = () => setWindowWidth(window.innerWidth)
        window.addEventListener('resize', handleResize)
        return () => window.removeEventListener('resize', handleResize)
    }, [])

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
                <p className="text-[15px] text-[#7F7F7F] leading-relaxed mb-6">
                    This interactive hanging board application is built specifically for desktop displays.
                    Please open this page on a computer or expand your browser window to interact with it.
                </p>

                {/* Resolution Badge */}
                <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-white border border-[#E1E1E1] text-[13px] font-medium text-[#7F7F7F]">
                    <span>Screen width: <strong className="text-[#111827]">{windowWidth}px</strong></span>
                    <span className="w-1 h-1 rounded-full bg-[#D1D5DB]" />
                    <span>Requires: <strong className="text-[#111827]">1140px+</strong></span>
                </div>
            </div>
        </div>
    )
}
