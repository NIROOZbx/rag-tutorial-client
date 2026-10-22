import { useState, useRef, useCallback } from 'react'
import type { ScreenState, ChatMessage } from '../types/chat'
import { uploadDocument, askQuestion } from '../services/api'

export function useChatState() {
  const [screenState, setScreenState] = useState<ScreenState>('upload')
  const [documentId, setDocumentId] = useState<string | null>(null)
  const [activeFileName, setActiveFileName] = useState<string>('Untitled chat')
  const [inputMessage, setInputMessage] = useState('')
  const [messages, setMessages] = useState<ChatMessage[]>([])
  const [isUploading, setIsUploading] = useState(false)
  const [uploadingFile, setUploadingFile] = useState<File | null>(null)
  const [uploadProgress, setUploadProgress] = useState(0)
  const [isAnswering, setIsAnswering] = useState(false)
  const [errorMessage, setErrorMessage] = useState<string | null>(null)

  const fileInputRef = useRef<HTMLInputElement>(null)
  const uploadTimerRef = useRef<number | null>(null)
  const abortControllerRef = useRef<AbortController | null>(null)

  const openFileBrowser = useCallback(() => {
    if (fileInputRef.current) {
      fileInputRef.current.value = ''
      fileInputRef.current.click()
    }
  }, [])

  const cancelUpload = useCallback(() => {
    if (uploadTimerRef.current) {
      clearInterval(uploadTimerRef.current)
      uploadTimerRef.current = null
    }
    if (abortControllerRef.current) {
      abortControllerRef.current.abort()
      abortControllerRef.current = null
    }
    if (fileInputRef.current) {
      fileInputRef.current.value = ''
    }
    setIsUploading(false)
    setUploadingFile(null)
    setUploadProgress(0)
  }, [])

  // Handle uploading PDF to POST /upload with progress
  const handleFileUpload = useCallback(async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    setUploadingFile(file)
    setIsUploading(true)
    setUploadProgress(15)
    setErrorMessage(null)

    const controller = new AbortController()
    abortControllerRef.current = controller

    // Smoothly step progress while file uploads and server processes chunks
    uploadTimerRef.current = window.setInterval(() => {
      setUploadProgress((prev) => {
        if (prev < 45) return prev + 12
        if (prev < 75) return prev + 8
        if (prev < 90) return prev + 3
        return prev
      })
    }, 200)

    try {
      const res = await uploadDocument(file)

      if (uploadTimerRef.current) {
        clearInterval(uploadTimerRef.current)
        uploadTimerRef.current = null
      }

      setUploadProgress(100)

      // Brief delay so user sees 100% completion before switching to chat
      await new Promise((resolve) => setTimeout(resolve, 350))

      setDocumentId(res.document_id)
      setActiveFileName(res.document_name || file.name)
      setMessages([])
      setScreenState('conversation')
    } catch (err: unknown) {
      if (uploadTimerRef.current) {
        clearInterval(uploadTimerRef.current)
        uploadTimerRef.current = null
      }

      // If user aborted via cancel button, do not show error screen
      if (err instanceof Error && err.name === 'AbortError') {
        return
      }

      const msg = err instanceof Error ? err.message : 'Upload failed'
      setErrorMessage(msg)
      setScreenState('error')
    } finally {
      setIsUploading(false)
      setUploadingFile(null)
      abortControllerRef.current = null
    }
  }, [])

  // Handle asking question via POST /question
  const handleSendMessage = useCallback(async () => {
    if (!inputMessage.trim() || isAnswering || !documentId) return

    const questionText = inputMessage.trim()
    setInputMessage('')

    // Append user question
    const userMsgId = `user-${Date.now()}`
    setMessages((prev) => [
      ...prev,
      {
        id: userMsgId,
        sender: 'user',
        text: questionText,
      },
    ])

    setIsAnswering(true)

    try {
      const res = await askQuestion(questionText, documentId)
      setMessages((prev) => [
        ...prev,
        {
          id: `asst-${Date.now()}`,
          sender: 'assistant',
          text: res.answer,
        },
      ])
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Failed to retrieve answer'
      setMessages((prev) => [
        ...prev,
        {
          id: `asst-err-${Date.now()}`,
          sender: 'assistant',
          text: msg,
          isError: true,
        },
      ])
    } finally {
      setIsAnswering(false)
    }
  }, [inputMessage, isAnswering, documentId])

  const retryLastQuestion = useCallback(async () => {
    const lastUserMsg = [...messages].reverse().find((m) => m.sender === 'user')
    if (!lastUserMsg || !documentId || isAnswering) return

    setMessages((prev) => prev.filter((m) => !m.isError))
    setIsAnswering(true)

    try {
      const res = await askQuestion(lastUserMsg.text, documentId)
      setMessages((prev) => [
        ...prev,
        {
          id: `asst-${Date.now()}`,
          sender: 'assistant',
          text: res.answer,
        },
      ])
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Failed to retrieve answer'
      setMessages((prev) => [
        ...prev,
        {
          id: `asst-err-${Date.now()}`,
          sender: 'assistant',
          text: msg,
          isError: true,
        },
      ])
    } finally {
      setIsAnswering(false)
    }
  }, [messages, documentId, isAnswering])

  const retryUpload = useCallback(() => {
    setScreenState('upload')
    setErrorMessage(null)
    setIsUploading(false)
    setUploadingFile(null)
    setUploadProgress(0)
    openFileBrowser()
  }, [openFileBrowser])

  return {
    screenState,
    setScreenState,
    documentId,
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
  }
}
