/**
 * Base layer error types
 * These errors are used by foundational components and types
 */

/**
 * Base class for all base layer errors
 */
export abstract class BaseError extends Error {
  public readonly name: string
  public readonly timestamp: Date

  constructor(message: string, cause?: Error) {
    super(message)
    this.name = this.constructor.name
    this.timestamp = new Date()

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
 * Error thrown when environment configuration is invalid
 */
export class EnvironmentConfigurationError extends BaseError {
  public readonly environmentMode: string

  constructor(environmentMode: string, message: string, cause?: Error) {
    super(`Environment '${environmentMode}': ${message}`, cause)
    this.environmentMode = environmentMode
  }
}

/**
 * Error thrown when validation of typed values fails
 */
export class ValidationError extends BaseError {
  public readonly field?: string
  public readonly value: unknown

  constructor(message: string, field?: string, value?: unknown, cause?: Error) {
    super(message, cause)
    this.field = field
    this.value = value
  }
}

/**
 * Error thrown when system configuration is invalid
 */
export class ConfigurationError extends BaseError {
  public readonly configurationKey: string

  constructor(configurationKey: string, message: string, cause?: Error) {
    super(`Configuration error for '${configurationKey}': ${message}`, cause)
    this.configurationKey = configurationKey
  }
}
