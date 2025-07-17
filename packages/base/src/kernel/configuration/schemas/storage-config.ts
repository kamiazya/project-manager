/**
 * Storage Configuration Schema
 *
 * Defines the structure and validation for storage-related configuration
 * settings. This is part of the Shared Kernel since storage concepts
 * affect multiple bounded contexts.
 */

/**
 * Available file encodings
 */
export type FileEncoding = 'utf8' | 'utf16le' | 'latin1' | 'ascii'

/**
 * Configuration schema for storage settings
 */
export interface StorageConfigSchema {
  /**
   * Base directory for data storage
   * Empty string means use XDG compliant default
   */
  readonly dataPath: string

  /**
   * Enable automatic backups before modifications
   */
  readonly backupEnabled: boolean

  /**
   * Number of backup files to keep
   */
  readonly backupCount: number

  /**
   * Follow XDG Base Directory specification
   */
  readonly xdgCompliant: boolean

  /**
   * File encoding for text files
   */
  readonly fileEncoding: FileEncoding

  /**
   * Enable compression for stored data
   */
  readonly compressionEnabled: boolean

  /**
   * Maximum file size before compression (in bytes)
   */
  readonly compressionThreshold: number

  /**
   * Enable file locking for concurrent access
   */
  readonly fileLockingEnabled: boolean

  /**
   * Timeout for file operations (in milliseconds)
   */
  readonly fileOperationTimeout: number

  /**
   * Enable automatic cleanup of temporary files
   */
  readonly autoCleanupEnabled: boolean

  /**
   * Age threshold for automatic cleanup (in days)
   */
  readonly cleanupThresholdDays: number

  /**
   * Enable file integrity checks
   */
  readonly integrityChecksEnabled: boolean

  /**
   * Sync operations to disk immediately
   */
  readonly syncToDisk: boolean
}

/**
 * Validation functions for storage configuration
 */
export const StorageConfigValidation = {
  /**
   * Validate file encoding value
   */
  isValidFileEncoding: (value: string): value is FileEncoding => {
    return ['utf8', 'utf16le', 'latin1', 'ascii'].includes(value)
  },

  /**
   * Validate path format (basic validation)
   */
  isValidPath: (value: string): boolean => {
    // Allow empty string for default path
    if (value === '') return true

    // Basic path validation - not empty, no null bytes
    return typeof value === 'string' && value.length > 0 && !value.includes('\0')
  },

  /**
   * Validate timeout value
   */
  isValidTimeout: (value: number): boolean => {
    return typeof value === 'number' && value > 0 && value <= 300000 // Max 5 minutes
  },

  /**
   * Validate backup count
   */
  isValidBackupCount: (value: number): boolean => {
    return typeof value === 'number' && value >= 0 && value <= 100 // Reasonable upper limit
  },

  /**
   * Validate compression threshold
   */
  isValidCompressionThreshold: (value: number): boolean => {
    return typeof value === 'number' && value >= 0 && value <= 100 * 1024 * 1024 // Max 100MB
  },

  /**
   * Validate cleanup threshold
   */
  isValidCleanupThreshold: (value: number): boolean => {
    return typeof value === 'number' && value >= 1 && value <= 365 // Max 1 year
  },

  /**
   * Validate entire storage configuration
   */
  isValidConfig: (config: unknown): config is StorageConfigSchema => {
    if (!config || typeof config !== 'object') return false

    const c = config as Record<string, unknown>

    return (
      typeof c.dataPath === 'string' &&
      StorageConfigValidation.isValidPath(c.dataPath) &&
      typeof c.backupEnabled === 'boolean' &&
      typeof c.backupCount === 'number' &&
      StorageConfigValidation.isValidBackupCount(c.backupCount) &&
      typeof c.xdgCompliant === 'boolean' &&
      typeof c.fileEncoding === 'string' &&
      StorageConfigValidation.isValidFileEncoding(c.fileEncoding) &&
      typeof c.compressionEnabled === 'boolean' &&
      typeof c.compressionThreshold === 'number' &&
      StorageConfigValidation.isValidCompressionThreshold(c.compressionThreshold) &&
      typeof c.fileLockingEnabled === 'boolean' &&
      typeof c.fileOperationTimeout === 'number' &&
      StorageConfigValidation.isValidTimeout(c.fileOperationTimeout) &&
      typeof c.autoCleanupEnabled === 'boolean' &&
      typeof c.cleanupThresholdDays === 'number' &&
      StorageConfigValidation.isValidCleanupThreshold(c.cleanupThresholdDays) &&
      typeof c.integrityChecksEnabled === 'boolean' &&
      typeof c.syncToDisk === 'boolean'
    )
  },
}
