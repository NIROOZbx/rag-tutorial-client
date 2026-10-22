import ReactMarkdown from 'react-markdown'
import remarkGfm from 'remark-gfm'

interface MarkdownRendererProps {
    content: string
}

/**
 * Normalizes unwanted symbols, non-breaking hyphens, and zero-width artifacts
 * commonly introduced during PDF extraction or LLM token generation.
 */
function cleanPdfMarkdown(raw: string): string {
    if (!raw) return ''
    return (
        raw
            // Replace non-breaking hyphens (\u2011) with standard hyphens
            .replace(/\u2011/g, '-')
            // Replace narrow non-breaking space (\u202F) & non-breaking space (\u00A0) with standard space
            .replace(/[\u202F\u00A0]/g, ' ')
            // Strip zero-width spaces (\u200B-\u200D) and byte-order marks (\uFEFF)
            .replace(/[\u200B-\u200D\uFEFF]/g, '')
    )
}

export function MarkdownRenderer({ content }: MarkdownRendererProps) {
    const sanitized = cleanPdfMarkdown(content)

    return (
        <div className="text-[16px] leading-relaxed text-[#7F7F7F]">
            <ReactMarkdown
                remarkPlugins={[remarkGfm]}
                components={{
                    p: ({ children }) => (
                        <p className="mb-2.5 last:mb-0 leading-relaxed text-[#7F7F7F] text-[16px]">
                            {children}
                        </p>
                    ),
                    strong: ({ children }) => (
                        <strong className="font-semibold text-[#111827]">
                            {children}
                        </strong>
                    ),
                    em: ({ children }) => <em className="italic">{children}</em>,
                    ul: ({ children }) => (
                        <ul className="list-disc pl-5 my-2 space-y-1.5 marker:text-[#9CA3AF]">
                            {children}
                        </ul>
                    ),
                    ol: ({ children }) => (
                        <ol className="list-decimal pl-5 my-2 space-y-1.5 marker:text-[#9CA3AF]">
                            {children}
                        </ol>
                    ),
                    li: ({ children }) => (
                        <li className="leading-relaxed pl-1 text-[#7F7F7F] text-[16px]">
                            {children}
                        </li>
                    ),
                    h1: ({ children }) => (
                        <h1 className="text-[20px] font-bold text-[#111827] mt-3 mb-1.5">
                            {children}
                        </h1>
                    ),
                    h2: ({ children }) => (
                        <h2 className="text-[18px] font-bold text-[#111827] mt-2.5 mb-1">
                            {children}
                        </h2>
                    ),
                    h3: ({ children }) => (
                        <h3 className="text-[16px] font-semibold text-[#111827] mt-2 mb-1">
                            {children}
                        </h3>
                    ),
                    code: ({ children }) => (
                        <code className="bg-[#EFEFEF] text-[#111827] rounded-[4px] px-1.5 py-0.5 text-xs font-mono">
                            {children}
                        </code>
                    ),
                }}
            >
                {sanitized}
            </ReactMarkdown>
        </div>
    )
}
