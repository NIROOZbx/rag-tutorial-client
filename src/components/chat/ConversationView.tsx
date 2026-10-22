import { useEffect, useRef } from 'react'
import { AlertCircle, RotateCcw } from 'lucide-react'
import type { ChatMessage } from '../../types/chat'
import { MarkdownRenderer } from './MarkdownRenderer'

interface ConversationViewProps {
    messages: ChatMessage[]
    isAnswering?: boolean
    onRetryQuestion?: () => void
}

export function ConversationView({
    messages,
    isAnswering = false,
    onRetryQuestion,
}: ConversationViewProps) {
    const bottomRef = useRef<HTMLDivElement>(null)

    // Smoothly scroll to the newest message whenever messages update or while answering
    useEffect(() => {
        bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
    }, [messages, isAnswering])

    return (
        <div className="w-full flex flex-col gap-[20px] px-[20px] py-[20px]">
            {messages.map((msg) => (
                <div
                    key={msg.id}
                    className={`w-full flex ${msg.sender === 'user' ? 'justify-end' : 'justify-start items-start gap-2.5'
                        }`}
                >
                    {/* Assistant Avatar Mascot (34px, pinned 20px from left frame edge) */}
                    {msg.sender === 'assistant' && (
                        <div className="w-[34px] h-[34px] shrink-0 mt-1">
                            <img src="/robot-head.png" alt="Robot Assistant" className="w-full h-full object-contain" />
                        </div>
                    )}

                    {/* 
            Message Bubbles:
            - Error state bubble: Clear diagnostic red card with retry action
            - User bubble: pinned 20px from right frame edge
            - Normal Assistant bubble: next to robot avatar
          */}
                    {msg.isError ? (
                        <div className="bg-[#FEF2F2] border border-[#FECACA] rounded-[20px] px-[22px] py-[14px] max-w-[560px] shadow-xs">
                            <div className="flex items-center gap-1.5 text-sm font-medium text-[#DC2626] mb-1">
                                <AlertCircle className="w-4 h-4 text-[#EF4444] shrink-0 stroke-[2.2]" />
                                <span>Failed to get answer</span>
                            </div>
                            <p className="text-xs text-[#7F1D1D] leading-relaxed">
                                {msg.text}
                            </p>
                            {onRetryQuestion && (
                                <button
                                    onClick={onRetryQuestion}
                                    className="mt-2.5 text-xs font-medium text-[#111827] bg-white border border-[#D1D5DB] hover:bg-gray-50 rounded-full px-3 py-1 transition flex items-center gap-1.5 cursor-pointer shadow-xs active:scale-95"
                                >
                                    <RotateCcw className="w-3 h-3 text-[#111827]" />
                                    <span>Retry question</span>
                                </button>
                            )}
                        </div>
                    ) : (
                        <div
                            className={`text-[16px]  transition text-[#7F7F7F] border-[0.5px] border-[#E1E1E1] bg-white ${msg.sender === 'user'
                                    ? 'rounded-[50px] px-[25px] py-[10px] max-w-[420px]'
                                    : 'rounded-[20px] px-[25px] py-[15px] max-w-[560px]'
                                }`}
                        >
                            {msg.sender === 'assistant' ? (
                                <MarkdownRenderer content={msg.text} />
                            ) : (
                                msg.text
                            )}
                        </div>
                    )}
                </div>
            ))}

            {/* Thinking / Answering Indicator */}
            {isAnswering && (
                <div className="w-full flex justify-start items-start gap-2.5">
                    <div className="w-[34px] h-[34px] shrink-0 mt-1">
                        <img src="/robot-head.png" alt="Robot Assistant" className="w-full h-full object-contain" />
                    </div>
                    <div className="bg-white text-[#7F7F7F] rounded-[20px] px-[25px] py-[15px] border-[0.5px] border-[#E1E1E1] flex items-center gap-1.5 shadow-xs">
                        <div className="w-2 h-2 rounded-full bg-[#8FDAF2] animate-bounce" style={{ animationDelay: '0ms' }} />
                        <div className="w-2 h-2 rounded-full bg-[#8FDAF2] animate-bounce" style={{ animationDelay: '150ms' }} />
                        <div className="w-2 h-2 rounded-full bg-[#8FDAF2] animate-bounce" style={{ animationDelay: '300ms' }} />
                    </div>
                </div>
            )}

            {/* Scroll anchor at bottom */}
            <div ref={bottomRef} className="h-0 w-full" />
        </div>
    )
}
