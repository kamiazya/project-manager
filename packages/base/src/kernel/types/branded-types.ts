/**
 * Branded Types for Type Safety
 *
 * Branded types (also known as nominal types) provide additional type safety
 * by creating unique types that are distinct from their underlying types.
 */

/**
 * Base branded type utility
 */
export type Brand<T, B> = T & { readonly __brand: B }

/**
 * Configuration ID type for type safety
 */
export type ConfigurationId = Brand<string, 'ConfigurationId'>

/**
 * Version string type for semantic versioning
 */
export type SemanticVersion = Brand<string, 'SemanticVersion'>

/**
 * File path type for file system operations
 */
export type FilePath = Brand<string, 'FilePath'>

/**
 * Environment name type for environment-specific operations
 */
export type EnvironmentName = Brand<string, 'EnvironmentName'>

/**
 * Timestamp type for time-based operations
 */
export type Timestamp = Brand<number, 'Timestamp'>

/**
 * Type guard for semantic version
 */
export function isSemanticVersion(value: string): value is SemanticVersion {
  const semverRegex =
    /^(?:0|[1-9]\d*)\.(?:0|[1-9]\d*)\.(?:0|[1-9]\d*)(?:-(?:(?:0|[1-9]\d*|\d*[a-zA-Z-][0-9a-zA-Z-]*)(?:\.(?:0|[1-9]\d*|\d*[a-zA-Z-][0-9a-zA-Z-]*))*))?(?:\+(?:[0-9a-zA-Z-]+(?:\.[0-9a-zA-Z-]+)*))?$/
  return semverRegex.test(value)
}

/**
 * Create a semantic version from a string
 */
export function createSemanticVersion(value: string): SemanticVersion {
  if (!isSemanticVersion(value)) {
    throw new Error(`Invalid semantic version: ${value}`)
  }
  return value
}

/**
 * Type guard for file path
 */
export function isFilePath(value: string): value is FilePath {
  // Basic path validation - can be extended as needed
  return typeof value === 'string' && value.length > 0
}

/**
 * Create a file path from a string
 */
export function createFilePath(value: string): FilePath {
  if (!isFilePath(value)) {
    throw new Error(`Invalid file path: ${value}`)
  }
  return value as FilePath
}

/**
 * Create a timestamp from a number
 */
export function createTimestamp(value: number = Date.now()): Timestamp {
  if (typeof value !== 'number' || value < 0 || Number.isNaN(value)) {
    throw new Error(`Invalid timestamp: ${value}`)
  }
  return value as Timestamp
}

/**
 * Create a configuration ID from a string
 */
export function createConfigurationId(value: string): ConfigurationId {
  if (typeof value !== 'string' || value.length === 0) {
    throw new Error(`Invalid configuration ID: ${value}`)
  }
  return value as ConfigurationId
}

/**
 * Create an environment name from a string
 */
export function createEnvironmentName(value: string): EnvironmentName {
  if (typeof value !== 'string' || value.length === 0) {
    throw new Error(`Invalid environment name: ${value}`)
  }
  return value as EnvironmentName
}
