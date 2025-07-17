/**
 * Environment Variable Configuration Loader
 *
 * Loads configuration data from environment variables. This is part of the
 * Common Infrastructure since it provides technical capabilities for
 * environment-based configuration management.
 */

import { BaseConfigurationLoader } from './configuration-loader.ts'

/**
 * Configuration loader for environment variables
 */
export class EnvironmentLoader<T = unknown> extends BaseConfigurationLoader<T> {
  constructor(
    private readonly prefix: string = 'PM_',
    priority: number = 100, // Higher priority than files
    private readonly env: Record<string, string | undefined> = process.env
  ) {
    super(`env:${prefix}`, priority)
  }

  async load(): Promise<Partial<T>> {
    const config: Record<string, unknown> = {}

    // Find all environment variables with the specified prefix
    for (const [key, value] of Object.entries(this.env)) {
      if (key.startsWith(this.prefix) && value !== undefined) {
        const configKey = this.transformKey(key)
        const configValue = this.transformValue(value)
        this.setNestedValue(config, configKey, configValue)
      }
    }

    return config as Partial<T>
  }

  /**
   * Transform environment variable key to configuration key
   * PM_TICKET_DEFAULT_PRIORITY -> ticket.defaultPriority
   */
  private transformKey(envKey: string): string {
    const withoutPrefix = envKey.slice(this.prefix.length)
    const parts = withoutPrefix.toLowerCase().split('_')

    // Convert to camelCase with dot notation for nested objects
    const camelCaseKey = parts
      .map((part, index) => {
        if (index === 0) return part
        return part.charAt(0).toUpperCase() + part.slice(1)
      })
      .join('')

    // Insert dots before capital letters to create nested structure
    // ticketDefaultPriority -> ticket.defaultPriority
    return camelCaseKey.replace(/([a-z])([A-Z])/g, '$1.$2').toLowerCase()
  }

  /**
   * Transform environment variable value to appropriate type
   */
  private transformValue(value: string): unknown {
    // Handle boolean values
    if (value.toLowerCase() === 'true') return true
    if (value.toLowerCase() === 'false') return false

    // Handle numbers
    if (/^\d+$/.test(value)) return parseInt(value, 10)
    if (/^\d+\.\d+$/.test(value)) return parseFloat(value)

    // Handle JSON values
    if (value.startsWith('{') || value.startsWith('[')) {
      try {
        return JSON.parse(value)
      } catch {
        // If JSON parsing fails, return as string
      }
    }

    // Return as string
    return value
  }

  /**
   * Set nested value in configuration object
   */
  private setNestedValue(obj: Record<string, unknown>, path: string, value: unknown): void {
    const keys = path.split('.')
    let current = obj

    for (let i = 0; i < keys.length - 1; i++) {
      const key = keys[i]
      if (!key || !(key in current) || typeof current[key] !== 'object') {
        current[key!] = {}
      }
      current = current[key!] as Record<string, unknown>
    }

    const finalKey = keys[keys.length - 1]
    if (finalKey) {
      current[finalKey] = value
    }
  }
}

/**
 * Utility functions for environment variable configuration
 */
export class EnvironmentUtils {
  /**
   * Create an environment loader with default settings
   *
   * @param prefix - Environment variable prefix (default: 'PM_')
   * @param priority - Loader priority (default: 100)
   * @returns EnvironmentLoader instance
   */
  static createLoader<T>(prefix: string = 'PM_', priority: number = 100): EnvironmentLoader<T> {
    return new EnvironmentLoader<T>(prefix, priority)
  }

  /**
   * Get all environment variables with a specific prefix
   *
   * @param prefix - Environment variable prefix
   * @returns Object with matching environment variables
   */
  static getEnvVarsWithPrefix(prefix: string): Record<string, string> {
    const result: Record<string, string> = {}

    for (const [key, value] of Object.entries(process.env)) {
      if (key.startsWith(prefix) && value !== undefined) {
        result[key] = value
      }
    }

    return result
  }

  /**
   * Check if required environment variables are set
   *
   * @param requiredVars - Array of required environment variable names
   * @returns Array of missing environment variables
   */
  static checkRequiredVars(requiredVars: string[]): string[] {
    const missing: string[] = []

    for (const varName of requiredVars) {
      if (!process.env[varName]) {
        missing.push(varName)
      }
    }

    return missing
  }
}
