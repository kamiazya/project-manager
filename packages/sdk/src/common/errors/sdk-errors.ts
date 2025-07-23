/**
 * SDK layer specific error types
 */

/**
 * Base class for all SDK errors
 */
export abstract class SdkError extends Error {
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
 * Error thrown when SDK configuration is invalid
 */
export class SdkConfigurationError extends SdkError {
  public readonly configurationField?: string

  constructor(message: string, configurationField?: string, cause?: Error) {
    super(message, cause)
    this.configurationField = configurationField
  }
}

/**
 * Error thrown when dependency injection container is invalid
 */
export class SdkContainerError extends SdkError {
  constructor(message: string, cause?: Error) {
    super(`Container error: ${message}`, cause)
  }
}

/**
 * Error thrown when SDK service is not available in current environment
 */
export class SdkServiceUnavailableError extends SdkError {
  public readonly serviceName: string
  public readonly currentEnvironment: string
  public readonly availableEnvironments: string[]

  constructor(
    serviceName: string,
    currentEnvironment: string,
    availableEnvironments: string[],
    cause?: Error
  ) {
    const message = `${serviceName} is not available in '${currentEnvironment}' environment. Available in: ${availableEnvironments.join(', ')}.`
    super(message, cause)
    this.serviceName = serviceName
    this.currentEnvironment = currentEnvironment
    this.availableEnvironments = availableEnvironments
  }
}
