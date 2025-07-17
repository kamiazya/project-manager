/**
 * Application Configuration Schema
 *
 * Main configuration schema that integrates all other configuration schemas
 * into a unified structure. This is part of the Shared Kernel since it
 * represents the complete application configuration.
 */

import type { StorageConfigSchema } from './storage-config.ts'
import type { TicketConfigSchema } from './ticket-config.ts'
import type { UIConfigSchema } from './ui-config.ts'

/**
 * Application environment types
 */
export type AppEnvironment = 'development' | 'production' | 'test'

/**
 * Complete application configuration schema
 */
export interface AppConfigSchema {
  /**
   * Application version
   */
  readonly version: string

  /**
   * Runtime environment
   */
  readonly environment: AppEnvironment

  /**
   * Ticket management configuration
   */
  readonly ticket: TicketConfigSchema

  /**
   * User interface configuration
   */
  readonly ui: UIConfigSchema

  /**
   * Storage configuration
   */
  readonly storage: StorageConfigSchema

  /**
   * Enable debug logging
   */
  readonly debug: boolean

  /**
   * Enable telemetry and usage analytics
   */
  readonly telemetryEnabled: boolean

  /**
   * Enable automatic updates
   */
  readonly autoUpdateEnabled: boolean

  /**
   * Update check interval (in hours)
   */
  readonly updateCheckInterval: number

  /**
   * Enable crash reporting
   */
  readonly crashReportingEnabled: boolean

  /**
   * Custom configuration extensions
   */
  readonly extensions: Record<string, unknown>
}

/**
 * Validation functions for application configuration
 */
export const AppConfigValidation = {
  /**
   * Validate environment value
   */
  isValidEnvironment: (value: string): value is AppEnvironment => {
    return ['development', 'production', 'test'].includes(value)
  },

  /**
   * Validate version string
   */
  isValidVersion: (value: string): boolean => {
    // Basic semver validation
    const semverRegex = /^\d+\.\d+\.\d+(-[a-zA-Z0-9-]+)?(\+[a-zA-Z0-9-]+)?$/
    return typeof value === 'string' && semverRegex.test(value)
  },

  /**
   * Validate update check interval
   */
  isValidUpdateInterval: (value: number): boolean => {
    return typeof value === 'number' && value >= 1 && value <= 24 * 7 // Max 1 week
  },

  /**
   * Validate extensions object
   */
  isValidExtensions: (value: unknown): value is Record<string, unknown> => {
    return typeof value === 'object' && value !== null && !Array.isArray(value)
  },

  /**
   * Validate entire application configuration
   * Note: This performs shallow validation. Deep validation of nested
   * objects is handled by their respective validation functions.
   */
  isValidConfig: (config: unknown): config is AppConfigSchema => {
    if (!config || typeof config !== 'object') return false

    const c = config as Record<string, unknown>

    return (
      typeof c.version === 'string' &&
      AppConfigValidation.isValidVersion(c.version) &&
      typeof c.environment === 'string' &&
      AppConfigValidation.isValidEnvironment(c.environment) &&
      typeof c.ticket === 'object' &&
      c.ticket !== null &&
      typeof c.ui === 'object' &&
      c.ui !== null &&
      typeof c.storage === 'object' &&
      c.storage !== null &&
      typeof c.debug === 'boolean' &&
      typeof c.telemetryEnabled === 'boolean' &&
      typeof c.autoUpdateEnabled === 'boolean' &&
      typeof c.updateCheckInterval === 'number' &&
      AppConfigValidation.isValidUpdateInterval(c.updateCheckInterval) &&
      typeof c.crashReportingEnabled === 'boolean' &&
      AppConfigValidation.isValidExtensions(c.extensions)
    )
  },
}
