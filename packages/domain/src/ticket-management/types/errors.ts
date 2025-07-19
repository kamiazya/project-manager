/**
 * Base error class for all ticket-related errors
 */
export class TicketError extends Error {
  public readonly name: string
  public readonly code: string | undefined

  constructor(message: string, code?: string) {
    super(message)
    this.name = this.constructor.name
    this.code = code

    // Maintains proper stack trace for where our error was thrown (only available on V8)
    if (Error.captureStackTrace) {
      Error.captureStackTrace(this, this.constructor)
    }
  }
}

/**
 * Error thrown when ticket validation fails
 */
export class TicketValidationError extends TicketError {
  public readonly field: string | undefined

  constructor(message: string, field?: string) {
    super(message, 'VALIDATION_ERROR')
    this.field = field
  }
}
