/**
 * Type-Safe Configuration Factory
 *
 * This module provides a type-safe configuration factory that uses
 * Result types for error handling and branded types for additional safety.
 */

import type { AppConfigSchema } from '../../../kernel/configuration/schemas/app-config.ts'
import { AppConfigValidation } from '../../../kernel/configuration/schemas/app-config.ts'
import type { StorageConfigSchema } from '../../../kernel/configuration/schemas/storage-config.ts'
import type { TicketConfigSchema } from '../../../kernel/configuration/schemas/ticket-config.ts'
import { TicketConfigValidation } from '../../../kernel/configuration/schemas/ticket-config.ts'
import type { UIConfigSchema } from '../../../kernel/configuration/schemas/ui-config.ts'
import type { Brand } from '../../../kernel/types/branded-types.ts'
import type { Result } from '../../../kernel/types/result-types.ts'
import { failure, success, validationError } from '../../../kernel/types/result-types.ts'
import type { CompleteConfigurationSchema } from './configuration-factory.ts'
import { ConfigurationFactory } from './configuration-factory.ts'

/**
 * Validated configuration type
 */
export type ValidatedConfiguration = Brand<CompleteConfigurationSchema, 'ValidatedConfiguration'>

/**
 * Configuration validation context
 */
export interface ValidationContext {
  readonly strict: boolean
  readonly environment: string
  readonly skipOptional: boolean
}

/**
 * Default validation context
 */
export const DEFAULT_VALIDATION_CONTEXT: ValidationContext = {
  strict: true,
  environment: 'development',
  skipOptional: false,
} as const

/**
 * Type-safe configuration factory
 */
export class TypeSafeConfigurationFactory {
  /**
   * Create and validate a configuration
   */
  static createValidatedConfiguration(
    context: ValidationContext = DEFAULT_VALIDATION_CONTEXT
  ): Result<ValidatedConfiguration, string[]> {
    try {
      // Create configuration using the existing factory
      const config = ConfigurationFactory.createConfiguration()

      // Validate the configuration
      const validationResult = TypeSafeConfigurationFactory.validateConfiguration(config, context)

      if (!validationResult.success) {
        return failure(validationResult.errors)
      }

      return success(config as ValidatedConfiguration)
    } catch (error) {
      return failure([
        `Configuration creation failed: ${error instanceof Error ? error.message : String(error)}`,
      ])
    }
  }

  /**
   * Validate a complete configuration
   */
  static validateConfiguration(
    config: CompleteConfigurationSchema,
    context: ValidationContext = DEFAULT_VALIDATION_CONTEXT
  ): { success: boolean; errors: string[] } {
    const errors: string[] = []

    // Validate app configuration
    const appErrors = TypeSafeConfigurationFactory.validateAppConfiguration(config.app, context)
    errors.push(...appErrors)

    // Validate ticket configuration
    const ticketErrors = TypeSafeConfigurationFactory.validateTicketConfiguration(
      config.ticket,
      context
    )
    errors.push(...ticketErrors)

    // Validate UI configuration
    const uiErrors = TypeSafeConfigurationFactory.validateUIConfiguration(config.ui, context)
    errors.push(...uiErrors)

    // Validate storage configuration
    const storageErrors = TypeSafeConfigurationFactory.validateStorageConfiguration(
      config.storage,
      context
    )
    errors.push(...storageErrors)

    // Validate cross-configuration consistency
    const consistencyErrors = TypeSafeConfigurationFactory.validateConsistency(config, context)
    errors.push(...consistencyErrors)

    return {
      success: errors.length === 0,
      errors: errors.filter(Boolean),
    }
  }

  /**
   * Validate app configuration
   */
  private static validateAppConfiguration(
    config: CompleteConfigurationSchema['app'],
    context: ValidationContext
  ): string[] {
    const errors: string[] = []

    // Validate required fields
    if (!config.name || typeof config.name !== 'string') {
      errors.push('App name is required and must be a string')
    }

    if (!config.version || !AppConfigValidation.isValidVersion(config.version)) {
      errors.push('App version is required and must be a valid semantic version')
    }

    if (!AppConfigValidation.isValidEnvironment(config.environment)) {
      errors.push('App environment must be one of: development, production, test')
    }

    // Validate boolean fields
    const booleanFields = [
      'debug',
      'enableDebugMode',
      'enableVerboseLogging',
      'telemetryEnabled',
      'enableTelemetry',
      'crashReportingEnabled',
      'enableCrashReporting',
      'autoUpdateEnabled',
      'enableUpdateCheck',
    ] as const

    for (const field of booleanFields) {
      if (typeof config[field] !== 'boolean') {
        errors.push(`App.${field} must be a boolean`)
      }
    }

    // Validate update check interval
    if (!AppConfigValidation.isValidUpdateInterval(config.updateCheckInterval)) {
      errors.push('Update check interval must be a number between 1 and 168 hours')
    }

    // Validate extensions
    if (!AppConfigValidation.isValidExtensions(config.extensions)) {
      errors.push('Extensions must be an object')
    }

    // Strict mode validations
    if (context.strict) {
      // Check for logical inconsistencies
      if (config.environment === 'production' && config.debug) {
        errors.push('Debug mode should not be enabled in production')
      }

      if (config.enableDebugMode && !config.debug) {
        errors.push('enableDebugMode and debug should be consistent')
      }

      if (config.enableTelemetry !== config.telemetryEnabled) {
        errors.push('enableTelemetry and telemetryEnabled should be consistent')
      }
    }

    return errors
  }

  /**
   * Validate ticket configuration
   */
  private static validateTicketConfiguration(
    config: TicketConfigSchema,
    context: ValidationContext
  ): string[] {
    const errors: string[] = []

    // Validate priorities
    if (!TicketConfigValidation.isValidPriority(config.defaultPriority)) {
      errors.push('Default priority must be one of: high, medium, low')
    }

    // Validate types
    if (!TicketConfigValidation.isValidType(config.defaultType)) {
      errors.push('Default type must be one of: feature, bug, task')
    }

    // Validate statuses
    if (!TicketConfigValidation.isValidStatus(config.defaultStatus)) {
      errors.push('Default status must be one of: pending, in_progress, completed, archived')
    }

    // Validate lengths
    if (config.maxTitleLength <= 0 || config.maxTitleLength > 1000) {
      errors.push('Max title length must be between 1 and 1000 characters')
    }

    if (config.maxDescriptionLength <= 0 || config.maxDescriptionLength > 100000) {
      errors.push('Max description length must be between 1 and 100000 characters')
    }

    // Validate ID format
    const validIdFormats = ['hex', 'uuid', 'sequential', 'timestamp']
    if (!validIdFormats.includes(config.idFormat)) {
      errors.push(`ID format must be one of: ${validIdFormats.join(', ')}`)
    }

    // Validate ID length
    if (config.idLength <= 0 || config.idLength > 50) {
      errors.push('ID length must be between 1 and 50 characters')
    }

    // Validate status transitions
    if (!config.allowStatusTransitions || typeof config.allowStatusTransitions !== 'object') {
      errors.push('Status transitions must be defined')
    } else {
      for (const [from, tos] of Object.entries(config.allowStatusTransitions)) {
        if (!TicketConfigValidation.isValidStatus(from)) {
          errors.push(`Invalid status transition from: ${from}`)
        }
        if (!Array.isArray(tos)) {
          errors.push(`Status transitions for ${from} must be an array`)
        } else {
          for (const to of tos) {
            if (!TicketConfigValidation.isValidStatus(to)) {
              errors.push(`Invalid status transition to: ${to}`)
            }
          }
        }
      }
    }

    return errors
  }

  /**
   * Validate UI configuration
   */
  private static validateUIConfiguration(
    config: UIConfigSchema,
    context: ValidationContext
  ): string[] {
    const errors: string[] = []

    // Validate output format
    const validOutputFormats = ['table', 'json', 'yaml', 'plain']
    if (!validOutputFormats.includes(config.outputFormat)) {
      errors.push(`Output format must be one of: ${validOutputFormats.join(', ')}`)
    }

    // Validate theme
    if (!config.theme || typeof config.theme !== 'string') {
      errors.push('Theme must be a string')
    }

    // Validate language
    if (!config.language || typeof config.language !== 'string') {
      errors.push('Language must be a string')
    }

    // Validate numeric fields
    if (config.itemsPerPage <= 0 || config.itemsPerPage > 1000) {
      errors.push('Items per page must be between 1 and 1000')
    }

    if (config.maxTitleLength <= 0 || config.maxTitleLength > 200) {
      errors.push('Max title length must be between 1 and 200 characters')
    }

    // Validate boolean fields
    const booleanFields = [
      'enableColorOutput',
      'enableInteractiveMode',
      'showProgressBars',
      'enableSoundNotifications',
      'enableDesktopNotifications',
    ] as const

    for (const field of booleanFields) {
      if (typeof config[field] !== 'boolean') {
        errors.push(`UI.${field} must be a boolean`)
      }
    }

    return errors
  }

  /**
   * Validate storage configuration
   */
  private static validateStorageConfiguration(
    config: StorageConfigSchema,
    context: ValidationContext
  ): string[] {
    const errors: string[] = []

    // Validate data path
    if (typeof config.dataPath !== 'string') {
      errors.push('Data path must be a string')
    }

    // Validate boolean fields
    const booleanFields = [
      'backupEnabled',
      'xdgCompliant',
      'compressionEnabled',
      'fileLockingEnabled',
      'autoCleanupEnabled',
      'integrityChecksEnabled',
      'syncToDisk',
    ] as const

    for (const field of booleanFields) {
      if (typeof config[field] !== 'boolean') {
        errors.push(`Storage.${field} must be a boolean`)
      }
    }

    // Validate numeric fields
    if (config.backupCount <= 0 || config.backupCount > 100) {
      errors.push('Backup count must be between 1 and 100')
    }

    if (config.compressionThreshold <= 0) {
      errors.push('Compression threshold must be greater than 0')
    }

    if (config.fileOperationTimeout <= 0) {
      errors.push('File operation timeout must be greater than 0')
    }

    if (config.cleanupThresholdDays <= 0) {
      errors.push('Cleanup threshold days must be greater than 0')
    }

    // Validate file encoding
    const validEncodings = ['utf8', 'utf16le', 'latin1', 'base64', 'hex']
    if (!validEncodings.includes(config.fileEncoding)) {
      errors.push(`File encoding must be one of: ${validEncodings.join(', ')}`)
    }

    return errors
  }

  /**
   * Validate cross-configuration consistency
   */
  private static validateConsistency(
    config: CompleteConfigurationSchema,
    context: ValidationContext
  ): string[] {
    const errors: string[] = []

    // Environment consistency
    if (config.app.environment === 'production') {
      if (config.app.debug) {
        errors.push('Debug mode should not be enabled in production')
      }
      if (!config.storage.backupEnabled) {
        errors.push('Backups should be enabled in production')
      }
    }

    // Development consistency
    if (config.app.environment === 'development') {
      if (!config.app.debug) {
        errors.push('Debug mode should be enabled in development')
      }
    }

    // Test consistency
    if (config.app.environment === 'test') {
      if (config.app.telemetryEnabled) {
        errors.push('Telemetry should not be enabled in test environment')
      }
      if (config.storage.backupEnabled) {
        errors.push('Backups should not be enabled in test environment')
      }
    }

    return errors
  }

  /**
   * Type guard to check if a configuration is validated
   */
  static isValidatedConfiguration(
    config: CompleteConfigurationSchema
  ): config is ValidatedConfiguration {
    const validationResult = TypeSafeConfigurationFactory.validateConfiguration(config)
    return validationResult.success
  }

  /**
   * Safely cast a configuration to validated if it passes validation
   */
  static toValidatedConfiguration(
    config: CompleteConfigurationSchema
  ): Result<ValidatedConfiguration, string[]> {
    const validationResult = TypeSafeConfigurationFactory.validateConfiguration(config)

    if (validationResult.success) {
      return success(config as ValidatedConfiguration)
    }

    return failure(validationResult.errors)
  }
}
