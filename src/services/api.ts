/**
 * Backend API Client for Go RAG Server (Port 8080)
 */

export const API_BASE_URL =
  import.meta.env.VITE_API_BASE_URL ||
  (import.meta.env.DEV ? '/api' : 'http://localhost:8080')

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
 * Translates low-level browser network errors into clear, actionable messages.
 */
function handleNetworkError(err: unknown, context: string): Error {
  if (err instanceof Error) {
    if (err.name === 'AbortError') {
      return err
    }
    const msg = err.message.toLowerCase()
    if (
      msg.includes('failed to fetch') ||
      msg.includes('networkerror') ||
      msg.includes('econnrefused') ||
      msg.includes('connection refused')
    ) {
      return new Error(
        `Cannot connect to server at ${API_BASE_URL}. Please ensure your Go backend is running on port 8080.`
      )
    }
    return err
  }
  return new Error(`${context} failed due to an unexpected error.`)
}

/**
 * Checks whether the Go RAG API is responding.
 */
export async function checkHealth(): Promise<HealthResponse> {
  try {
    const res = await fetch(`${API_BASE_URL}/health`)
    if (!res.ok) {
      throw new Error(`Health check returned status ${res.status}`)
    }
    return await res.json()
  } catch (err) {
    throw handleNetworkError(err, 'Server health check')
  }
}

/**
 * Uploads a PDF for chunking and vector storage.
 * @param file The PDF File instance (max 10 MB)
 */
export async function uploadDocument(file: File): Promise<UploadResponse> {
  // 1. Verify file extension
  const isPdf =
    file.name.toLowerCase().endsWith('.pdf') ||
    file.type === 'application/pdf'
  if (!isPdf) {
    throw new Error('Only PDF documents are supported. Please select a valid .pdf file.')
  }

  // 2. Verify 10 MB limit
  if (file.size > 10 * 1024 * 1024) {
    const sizeMb = (file.size / (1024 * 1024)).toFixed(1)
    throw new Error(`File is too large (${sizeMb} MB). Maximum allowed size is 10 MB.`)
  }

  const formData = new FormData()
  formData.append('document', file)

  let res: Response
  try {
    res = await fetch(`${API_BASE_URL}/upload`, {
      method: 'POST',
      body: formData,
    })
  } catch (err) {
    throw handleNetworkError(err, 'PDF upload')
  }

  if (!res.ok) {
    const errorText = await res.text().catch(() => '')
    if (res.status === 413) {
      throw new Error('File exceeds the server upload limit of 10 MB.')
    }
    if (res.status === 400) {
      throw new Error(
        errorText || 'The server could not parse this PDF. Please verify the document is not password-protected or corrupted.'
      )
    }
    if (res.status === 500) {
      throw new Error(
        errorText || 'Server error (500) occurred while extracting text or storing chunks.'
      )
    }
    throw new Error(errorText || `Upload failed with HTTP status ${res.status}`)
  }

  return res.json()
}

/**
 * Asks a question about an uploaded document.
 * @param question The user's query
 * @param documentId The UUID returned from /upload
 */
export async function askQuestion(
  question: string,
  documentId: string
): Promise<QuestionResponse> {
  let res: Response
  try {
    res = await fetch(`${API_BASE_URL}/question`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        question,
        doc_id: documentId,
      }),
    })
  } catch (err) {
    throw handleNetworkError(err, 'Question request')
  }

  if (!res.ok) {
    const errorText = await res.text().catch(() => '')
    if (res.status === 400) {
      throw new Error(errorText || 'Invalid question or document ID.')
    }
    if (res.status === 500) {
      throw new Error(errorText || 'Internal server error while retrieving answer.')
    }
    throw new Error(errorText || `Request failed with HTTP status ${res.status}`)
  }

  return res.json()
}
