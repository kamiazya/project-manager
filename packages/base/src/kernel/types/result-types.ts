/**
 * Result Types for Type-Safe Error Handling
 *
 * Result types provide a functional approach to error handling without
 * throwing exceptions, making errors part of the type system.
 */

/**
 * Success result type
 */
export interface Success<T> {
  readonly success: true
  readonly data: T
}

/**
 * Error result type
 */
export interface Failure<E> {
  readonly success: false
  readonly error: E
}

/**
 * Result type that can be either success or failure
 */
export type Result<T, E> = Success<T> | Failure<E>

/**
 * Create a successful result
 */
export function success<T>(data: T): Success<T> {
  return { success: true, data }
}

/**
 * Create a failure result
 */
export function failure<E>(error: E): Failure<E> {
  return { success: false, error }
}

/**
 * Type guard to check if result is successful
 */
export function isSuccess<T, E>(result: Result<T, E>): result is Success<T> {
  return result.success === true
}

/**
 * Type guard to check if result is failure
 */
export function isFailure<T, E>(result: Result<T, E>): result is Failure<E> {
  return result.success === false
}

/**
 * Map over a successful result
 */
export function map<T, U, E>(result: Result<T, E>, fn: (value: T) => U): Result<U, E> {
  if (isSuccess(result)) {
    return success(fn(result.data))
  }
  return result
}

/**
 * FlatMap over a successful result
 */
export function flatMap<T, U, E>(
  result: Result<T, E>,
  fn: (value: T) => Result<U, E>
): Result<U, E> {
  if (isSuccess(result)) {
    return fn(result.data)
  }
  return result
}

/**
 * Handle both success and failure cases
 */
export function match<T, E, U>(
  result: Result<T, E>,
  onSuccess: (value: T) => U,
  onFailure: (error: E) => U
): U {
  if (isSuccess(result)) {
    return onSuccess(result.data)
  }
  return onFailure(result.error)
}

/**
 * Get the value from a result, throwing if it's an error
 */
export function unwrap<T, E>(result: Result<T, E>): T {
  if (isSuccess(result)) {
    return result.data
  }
  throw new Error(`Unwrapped a failure result: ${JSON.stringify(result.error)}`)
}

/**
 * Get the value from a result, returning a default if it's an error
 */
export function unwrapOr<T, E>(result: Result<T, E>, defaultValue: T): T {
  if (isSuccess(result)) {
    return result.data
  }
  return defaultValue
}

/**
 * Common error types for configuration operations
 */
export enum ConfigurationErrorType {
  VALIDATION_ERROR = 'VALIDATION_ERROR',
  PARSE_ERROR = 'PARSE_ERROR',
  NOT_FOUND = 'NOT_FOUND',
  PERMISSION_DENIED = 'PERMISSION_DENIED',
  UNKNOWN_ERROR = 'UNKNOWN_ERROR',
}

/**
 * Configuration error interface
 */
export interface ConfigurationError {
  readonly type: ConfigurationErrorType
  readonly message: string
  readonly context?: Record<string, unknown>
}

/**
 * Create a configuration error
 */
export function createConfigurationError(
  type: ConfigurationErrorType,
  message: string,
  context?: Record<string, unknown>
): ConfigurationError {
  return { type, message, context }
}

/**
 * Validation error helper
 */
export function validationError(
  message: string,
  context?: Record<string, unknown>
): ConfigurationError {
  return createConfigurationError(ConfigurationErrorType.VALIDATION_ERROR, message, context)
}

/**
 * Parse error helper
 */
export function parseError(message: string, context?: Record<string, unknown>): ConfigurationError {
  return createConfigurationError(ConfigurationErrorType.PARSE_ERROR, message, context)
}

/**
 * Not found error helper
 */
export function notFoundError(
  message: string,
  context?: Record<string, unknown>
): ConfigurationError {
  return createConfigurationError(ConfigurationErrorType.NOT_FOUND, message, context)
}

/**
 * Permission denied error helper
 */
export function permissionDeniedError(
  message: string,
  context?: Record<string, unknown>
): ConfigurationError {
  return createConfigurationError(ConfigurationErrorType.PERMISSION_DENIED, message, context)
}

/**
 * Unknown error helper
 */
export function unknownError(
  message: string,
  context?: Record<string, unknown>
): ConfigurationError {
  return createConfigurationError(ConfigurationErrorType.UNKNOWN_ERROR, message, context)
}
