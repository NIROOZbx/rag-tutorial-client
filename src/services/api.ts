import { AppError } from '../types/errors'

export const API_BASE_URL =
  import.meta.env.VITE_API_BASE_URL ||
  (import.meta.env.DEV ? '/api' : 'https://rag-tutorial.onrender.com')

export interface UploadResponse {
  message: string
  document_id: string
  document_name: string
  chunks: number
}

export interface QuestionResponse {
  answer: string
}

export interface HealthResponse {
  data: string
}

/**
 * Pings backend health endpoint to warm up sleeping free-tier servers in the background.
 */
export async function pingBackendHealth(): Promise<void> {
  try {
    await fetch(`${API_BASE_URL}/health`, { method: 'GET' })
  } catch {
    // Silent: background wake-up attempt
  }
}

/**
 * Executes a fetch request with 1 automatic retry on transient network failures.
 */
async function fetchWithRetry(
  input: RequestInfo | URL,
  init?: RequestInit,
  retries = 1
): Promise<Response> {
  try {
    return await fetch(input, init)
  } catch (err) {
    if (err instanceof Error && err.name === 'AbortError') {
      throw err
    }
    if (retries > 0) {
      // Short delay before auto-retry
      await new Promise((resolve) => setTimeout(resolve, 1500))
      return fetchWithRetry(input, init, retries - 1)
    }
    if (typeof navigator !== 'undefined' && !navigator.onLine) {
      throw new AppError('NETWORK')
    }
    throw new AppError('NETWORK')
  }
}

/**
 * Uploads a PDF for chunking and vector storage with client-side validation and typed error handling.
 */
export async function uploadDocument(
  file: File,
  signal?: AbortSignal
): Promise<UploadResponse> {
  // 1. Instant client-side validation: format
  const isPdf =
    file.name.toLowerCase().endsWith('.pdf') ||
    file.type === 'application/pdf'
  if (!isPdf) {
    throw new AppError('INVALID_FILE_TYPE')
  }

  // 2. Instant client-side validation: size (10 MB limit)
  if (file.size > 10 * 1024 * 1024) {
    throw new AppError('FILE_TOO_LARGE')
  }

  const formData = new FormData()
  formData.append('document', file)

  const res = await fetchWithRetry(`${API_BASE_URL}/upload`, {
    method: 'POST',
    body: formData,
    signal,
  })

  if (!res.ok) {
    if (res.status === 413) {
      throw new AppError('FILE_TOO_LARGE')
    }
    if (res.status === 429) {
      throw new AppError('RATE_LIMITED')
    }
    if (res.status === 400) {
      const errorText = (await res.text().catch(() => '')).toLowerCase()
      if (
        errorText.includes('password') ||
        errorText.includes('encrypt') ||
        errorText.includes('locked')
      ) {
        throw new AppError('PDF_PASSWORD_PROTECTED')
      }
      throw new AppError('PDF_CORRUPTED')
    }
    if (res.status >= 500) {
      throw new AppError('SERVER_UNAVAILABLE')
    }
    throw new AppError('UNKNOWN')
  }

  return res.json()
}

/**
 * Submits a question about an uploaded document.
 */
export async function askQuestion(
  question: string,
  documentId: string
): Promise<QuestionResponse> {
  const res = await fetchWithRetry(`${API_BASE_URL}/question`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      question,
      doc_id: documentId,
    }),
  })

  if (!res.ok) {
    if (res.status === 429) {
      throw new AppError('RATE_LIMITED')
    }
    if (res.status >= 500) {
      throw new AppError('SERVER_UNAVAILABLE')
    }
    throw new AppError('UNKNOWN')
  }

  return res.json()
}
