/**
 * Base class for all Application layer errors.
 * Application errors wrap domain errors and provide additional context
 * relevant to application use cases.
 */
export abstract class ApplicationError extends Error {
  public readonly name: string
  public readonly timestamp: Date
  public readonly context?: Record<string, unknown>

  constructor(message: string, context?: Record<string, unknown>, cause?: Error) {
    super(message)
    this.name = this.constructor.name
    this.timestamp = new Date()
    this.context = context

    // Maintains proper prototype chain for instanceof checks
    Object.setPrototypeOf(this, new.target.prototype)

    // Capture stack trace if available
    if (Error.captureStackTrace) {
      Error.captureStackTrace(this, this.constructor)
    }

    // Chain the original error if provided
    if (cause) {
      this.cause = cause
    }
  }
}

/**
 * Application layer error for ticket not found scenarios.
 * Extends ApplicationError and adds application-specific context.
 */
export class TicketNotFoundError extends ApplicationError {
  public readonly ticketId: string
  public readonly useCaseName?: string

  constructor(ticketId: string, useCaseName?: string, context?: Record<string, unknown>) {
    super(`Ticket with ID '${ticketId}' not found`, context)
    this.ticketId = ticketId
    this.useCaseName = useCaseName
  }
}

/**
 * Application layer error for ticket validation failures.
 * Extends ApplicationError and adds application-specific context.
 */
export class TicketValidationError extends ApplicationError {
  public readonly field?: string
  public readonly useCaseName?: string
  public readonly validationRules?: string[]

  constructor(
    message: string,
    field?: string,
    useCaseName?: string,
    validationRules?: string[],
    context?: Record<string, unknown>
  ) {
    super(message, context)
    this.field = field
    this.useCaseName = useCaseName
    this.validationRules = validationRules
  }
}

/**
 * Application layer error for use case execution failures.
 * Used when a use case fails due to business logic or operational issues.
 */
export class UseCaseExecutionError extends ApplicationError {
  public readonly useCaseName: string
  public readonly operation: string

  constructor(
    useCaseName: string,
    operation: string,
    message: string,
    context?: Record<string, unknown>,
    cause?: Error
  ) {
    super(`Use case '${useCaseName}' failed during '${operation}': ${message}`, context, cause)
    this.useCaseName = useCaseName
    this.operation = operation
  }
}

/**
 * Application layer error for repository operation failures.
 * Used when repository operations fail due to persistence or infrastructure issues.
 */
export class RepositoryError extends ApplicationError {
  public readonly repositoryName: string
  public readonly operation: string

  constructor(
    repositoryName: string,
    operation: string,
    message: string,
    context?: Record<string, unknown>,
    cause?: Error
  ) {
    super(`Repository '${repositoryName}' failed during '${operation}': ${message}`, context, cause)
    this.repositoryName = repositoryName
    this.operation = operation
  }
}
