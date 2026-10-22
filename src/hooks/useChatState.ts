import { useState, useRef, useCallback, useEffect } from 'react'
import type { ScreenState, ChatMessage } from '../types/chat'
import { uploadDocument, askQuestion, pingBackendHealth } from '../services/api'
import { AppError, type UploadErrorCode, ERROR_COPY } from '../types/errors'

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
  const [errorCode, setErrorCode] = useState<UploadErrorCode | null>(null)

  const fileInputRef = useRef<HTMLInputElement>(null)
  const lastFileRef = useRef<File | null>(null)
  const uploadTimerRef = useRef<number | null>(null)
  const abortControllerRef = useRef<AbortController | null>(null)

  // Silently ping backend health on initial load to wake up free-tier instance early
  useEffect(() => {
    pingBackendHealth()
  }, [])

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

  // Core upload pipeline with progress simulation and typed error handling
  const executeUpload = useCallback(async (file: File) => {
    lastFileRef.current = file
    setUploadingFile(file)
    setIsUploading(true)
    setUploadProgress(15)
    setErrorCode(null)

    const controller = new AbortController()
    abortControllerRef.current = controller

    // Smooth progress stepper
    uploadTimerRef.current = window.setInterval(() => {
      setUploadProgress((prev) => {
        if (prev < 45) return prev + 12
        if (prev < 75) return prev + 8
        if (prev < 90) return prev + 3
        return prev
      })
    }, 200)

    try {
      const res = await uploadDocument(file, controller.signal)

      if (uploadTimerRef.current) {
        clearInterval(uploadTimerRef.current)
        uploadTimerRef.current = null
      }

      setUploadProgress(100)

      // Brief delay for user to register 100% before entering workspace
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

      // User explicitly clicked Cancel
      if (err instanceof Error && err.name === 'AbortError') {
        return
      }

      if (err instanceof AppError) {
        setErrorCode(err.code)
      } else {
        setErrorCode('UNKNOWN')
      }

      setScreenState('error')
    } finally {
      setIsUploading(false)
      setUploadingFile(null)
      abortControllerRef.current = null
    }
  }, [])

  // Input file change handler
  const handleFileUpload = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0]
      if (!file) return
      executeUpload(file)
    },
    [executeUpload]
  )

  // Retry the upload (either re-runs the last file if retryable, or prompts for a new file)
  const retryUpload = useCallback(() => {
    if (lastFileRef.current && errorCode && ERROR_COPY[errorCode]?.retryable) {
      setScreenState('upload')
      executeUpload(lastFileRef.current)
    } else {
      setScreenState('upload')
      setErrorCode(null)
      openFileBrowser()
    }
  }, [errorCode, executeUpload, openFileBrowser])

  // Handle asking a question via POST /question
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
      let friendlyError = 'Something unexpected happened. Please try again.'
      if (err instanceof AppError) {
        friendlyError = ERROR_COPY[err.code]?.hint || friendlyError
      }
      setMessages((prev) => [
        ...prev,
        {
          id: `asst-err-${Date.now()}`,
          sender: 'assistant',
          text: friendlyError,
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
      let friendlyError = 'Something unexpected happened. Please try again.'
      if (err instanceof AppError) {
        friendlyError = ERROR_COPY[err.code]?.hint || friendlyError
      }
      setMessages((prev) => [
        ...prev,
        {
          id: `asst-err-${Date.now()}`,
          sender: 'assistant',
          text: friendlyError,
          isError: true,
        },
      ])
    } finally {
      setIsAnswering(false)
    }
  }, [messages, documentId, isAnswering])

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
    errorCode,
    fileInputRef,
    openFileBrowser,
    handleFileUpload,
    handleSendMessage,
    retryLastQuestion,
    retryUpload,
  }
}
