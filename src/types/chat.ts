export type ScreenState = 'upload' | 'conversation' | 'error'

export interface ChatMessage {
  id: string
  sender: 'user' | 'assistant'
  text: string
  timestamp?: string
  isError?: boolean
}

export interface UploadedDocument {
  documentId: string
  documentName: string
  chunks: number
}
