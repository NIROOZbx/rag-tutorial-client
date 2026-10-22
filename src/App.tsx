import { useChatState } from './hooks/useChatState'
import { useMatterPhysics } from './hooks/useMatterPhysics'
import { ProceduralRopes } from './components/common/ProceduralRopes'
import { SurroundBoard } from './components/layout/SurroundBoard'
import { InnerWorkspace } from './components/layout/InnerWorkspace'
import { UploadCard } from './components/upload/UploadCard'
import { UploadProgressCard } from './components/upload/UploadProgressCard'
import { ErrorCard } from './components/upload/ErrorCard'
import { ConversationView } from './components/chat/ConversationView'
import { Composer } from './components/chat/Composer'

export default function App() {
  const {
    screenState,
    activeFileName,
    inputMessage,
    setInputMessage,
    messages,
    isUploading,
    uploadingFile,
    uploadProgress,
    cancelUpload,
    isAnswering,
    errorMessage,
    fileInputRef,
    openFileBrowser,
    handleFileUpload,
    handleSendMessage,
    retryLastQuestion,
    retryUpload,
  } = useChatState()

  const { x, y, rotate, isDragging, handleBoardPointerDown } = useMatterPhysics()

  return (
    <div className="relative min-h-screen bg-white text-[#111827] flex flex-col items-center justify-start overflow-hidden font-sans selection:bg-[#8FDAF2] selection:text-[#111827] pb-16">
      {/* Hidden file input for uploads */}
      <input
        ref={fileInputRef}
        type="file"
        accept="application/pdf"
        onChange={handleFileUpload}
        className="hidden"
      />

      {/* Top Section: Centered Headline & Procedural Physics Ropes */}
      <div className="relative w-full max-w-[1140px] h-[220px] flex items-center justify-center select-none">
        {/* Procedural Vector Ropes: dynamically attached to ceiling and board */}
        <ProceduralRopes x={x} y={y} rotate={rotate} />

        {/* Centered Headline */}
        <div className="text-center px-4 z-10 pointer-events-none">
          <h1 className="text-2xl sm:text-[32px] md:text-[34px] font-normal text-[#111827] leading-[1.22]">
            Upload a PDF, ask questions, and
            <br />
            get answers from its content.
          </h1>
        </div>
      </div>

      {/* 
        Main Board (Surround + Workspace):
        Physical board suspended by ropes. Outer rim handles drag; inner workspace is interactive chat.
      */}
      <div
        className="w-full max-w-[1140px] flex flex-col items-center z-10 pointer-events-auto"
        style={{
          transform: `translate3d(${x}px, ${y}px, 0) rotate(${rotate}deg)`,
          willChange: 'transform',
        }}
      >
        <SurroundBoard onPointerDown={handleBoardPointerDown} isDragging={isDragging}>
          <InnerWorkspace
            title={screenState === 'conversation' ? activeFileName : 'Untitled chat'}
            footer={
              <Composer
                value={inputMessage}
                onChange={setInputMessage}
                onSend={handleSendMessage}
                disabled={screenState === 'upload' || isAnswering}
              />
            }
          >
            {screenState === 'upload' && !isUploading && (
              <UploadCard onBrowseClick={openFileBrowser} />
            )}

            {screenState === 'upload' && isUploading && (
              <UploadProgressCard
                fileName={uploadingFile?.name || 'document.pdf'}
                fileSize={uploadingFile?.size || 120 * 1024}
                progress={uploadProgress}
                onCancel={cancelUpload}
              />
            )}

            {screenState === 'conversation' && (
              <ConversationView
                messages={messages}
                isAnswering={isAnswering}
                onRetryQuestion={retryLastQuestion}
              />
            )}

            {screenState === 'error' && (
              <ErrorCard onRetry={retryUpload} errorMessage={errorMessage ?? undefined} />
            )}
          </InnerWorkspace>
        </SurroundBoard>
      </div>
    </div>
  )
}
