export type UploadErrorCode =
  | 'FILE_TOO_LARGE'
  | 'INVALID_FILE_TYPE'
  | 'PDF_PASSWORD_PROTECTED'
  | 'PDF_CORRUPTED'
  | 'RATE_LIMITED'
  | 'NETWORK'
  | 'SERVER_UNAVAILABLE'
  | 'UNKNOWN'

export interface ErrorCopy {
  title: string
  reason: string
  hint: string
  retryable: boolean
  actionLabel: string
}

export const ERROR_COPY: Record<UploadErrorCode, ErrorCopy> = {
  FILE_TOO_LARGE: {
    title: 'File too large',
    reason: 'This PDF exceeds the 10 MB limit.',
    hint: 'Choose a smaller file under 10 MB.',
    retryable: false,
    actionLabel: 'Choose another file',
  },
  INVALID_FILE_TYPE: {
    title: 'Unsupported file',
    reason: 'Only PDF files are supported.',
    hint: 'Choose a valid .pdf file.',
    retryable: false,
    actionLabel: 'Choose another file',
  },
  PDF_PASSWORD_PROTECTED: {
    title: 'PDF is locked',
    reason: 'This file is password-protected.',
    hint: 'Remove the password and upload again.',
    retryable: false,
    actionLabel: 'Choose another file',
  },
  PDF_CORRUPTED: {
    title: "Can't read this PDF",
    reason: 'The file may be damaged or unreadable.',
    hint: 'Try re-exporting it and upload again.',
    retryable: false,
    actionLabel: 'Choose another file',
  },
  RATE_LIMITED: {
    title: 'Too many uploads',
    reason: "You've hit the temporary upload limit.",
    hint: 'Wait a minute and try again.',
    retryable: true,
    actionLabel: 'Try again',
  },
  NETWORK: {
    title: "You're offline",
    reason: "We couldn't reach the server.",
    hint: 'Check your connection and retry.',
    retryable: true,
    actionLabel: 'Retry upload',
  },
  SERVER_UNAVAILABLE: {
    title: 'Temporarily unavailable',
    reason: 'Something went wrong on our end.',
    hint: 'Please try again in a moment.',
    retryable: true,
    actionLabel: 'Retry upload',
  },
  UNKNOWN: {
    title: 'Upload failed',
    reason: 'Something unexpected happened.',
    hint: 'Please try again in a moment.',
    retryable: true,
    actionLabel: 'Retry upload',
  },
}

export class AppError extends Error {
  code: UploadErrorCode

  constructor(code: UploadErrorCode, message?: string) {
    super(message || code)
    this.name = 'AppError'
    this.code = code
  }
}
