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
 * Application layer error for infrastructure operation failures.
 * Base class for all infrastructure-related errors (persistence, logging, external services).
 * This provides extensibility for future infrastructure concerns while maintaining
 * Clean Architecture principles by keeping infrastructure error abstractions in the application layer.
 */
export abstract class InfrastructureError extends ApplicationError {
  public readonly infrastructureType: string
  public readonly operation: string

  constructor(
    infrastructureType: string,
    operation: string,
    message: string,
    context?: Record<string, unknown>,
    cause?: Error
  ) {
    super(
      `Infrastructure '${infrastructureType}' failed during '${operation}': ${message}`,
      context,
      cause
    )
    this.infrastructureType = infrastructureType
    this.operation = operation
  }
}

/**
 * Application layer error for persistence operation failures.
 * Consolidates repository and storage concerns under a unified persistence abstraction.
 * Replaces both RepositoryError and StorageError for better cohesion.
 */
export class PersistenceError extends InfrastructureError {
  public readonly entityType?: string
  public readonly persistenceOperation: string

  constructor(
    operation: string,
    message: string,
    entityType?: string,
    context?: Record<string, unknown>,
    cause?: Error
  ) {
    super('Persistence', operation, message, context, cause)
    this.entityType = entityType
    this.persistenceOperation = operation
  }
}

/**
 * Application layer error for configuration failures.
 * Used when configuration is missing, invalid, or not properly initialized.
 */
export class ConfigurationError extends ApplicationError {
  public readonly configurationKey?: string
  public readonly operation: string

  constructor(
    operation: string,
    message: string,
    configurationKey?: string,
    context?: Record<string, unknown>,
    cause?: Error
  ) {
    super(`Configuration error during '${operation}': ${message}`, context, cause)
    this.configurationKey = configurationKey
    this.operation = operation
  }
}

/**
 * Application layer error for logging infrastructure failures.
 * Used when logging setup, configuration, or operations fail.
 */
export class LoggingError extends InfrastructureError {
  constructor(
    operation: string,
    message: string,
    context?: Record<string, unknown>,
    cause?: Error
  ) {
    super('Logging', operation, message, context, cause)
  }
}
