import type { ReactNode } from 'react'

interface InnerWorkspaceProps {
  title: string
  children: ReactNode
  footer: ReactNode
}

export function InnerWorkspace({ title, children, footer }: InnerWorkspaceProps) {
  return (
    <div
      data-no-drag="true"
      className="w-full h-[674px] rounded-[30px] bg-[#F4F4F4] flex flex-col justify-between relative overflow-hidden"
    >
      {/* Header: 54px height, 0.25px hairline border, title in caption color #383838 */}
      <div className="h-[54px] shrink-0 w-full flex items-center justify-center border-b-[0.25px] border-default px-6 select-none bg-[#F4F4F4] z-10">
        <span className="text-[16px] font-normal text-caption">
          {title}
        </span>
      </div>

      {/* 
        Main Content Body:
        Scrollable inner frame when conversation becomes long
      */}
      <div className="flex-1 overflow-y-auto w-full relative flex flex-col">
        {children}
      </div>

      {/* Footer / Composer Slot: fixed at bottom */}
      <div className="shrink-0 w-full z-10 bg-[#F4F4F4]">
        {footer}
      </div>
    </div>
  )
}
