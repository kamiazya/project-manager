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
 * Error thrown when a ticket is not found
 */
export class TicketNotFoundError extends TicketError {
  public readonly ticketId: string

  constructor(ticketId: string) {
    super(`Ticket not found: ${ticketId}`, 'TICKET_NOT_FOUND')
    this.ticketId = ticketId
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

/**
 * Error thrown when storage operations fail
 */
export class StorageError extends TicketError {
  public readonly originalError: Error | undefined

  constructor(message: string, originalError?: Error) {
    super(message, 'STORAGE_ERROR')
    this.originalError = originalError
  }
}

/**
 * Type guard to check if an error is a TicketError
 */
export function isTicketError(error: any): error is TicketError {
  return error instanceof TicketError
}
