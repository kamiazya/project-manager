/**
 * Infrastructure layer error types
 * These errors are specific to infrastructure concerns like persistence and external integrations
 */

/**
 * Error thrown when storage operations fail
 */
export class StorageError extends Error {
  public readonly originalError: Error | undefined

  constructor(message: string, originalError?: Error) {
    super(message)
    this.name = 'StorageError'
    this.originalError = originalError

    // Maintains proper stack trace for where our error was thrown (only available on V8)
    if (Error.captureStackTrace) {
      Error.captureStackTrace(this, this.constructor)
    }
  }
}
