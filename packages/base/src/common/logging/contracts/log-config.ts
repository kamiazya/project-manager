/**
 * Configuration interface for the logging system.
 *
 * Provides comprehensive configuration options for different environments,
 * transport mechanisms, performance tuning, and operational settings.
 */

import { type EnvironmentMode } from '../../environment/environment-mode.ts'
import { type LogLevel, LogLevelValues } from '../types/log-level.ts'
export interface LogConfig {
  /** Minimum log level to output (debug, info, warn, error, fatal) */
  level: LogLevel

  /** Environment mode affecting default behaviors */
  environment: EnvironmentMode

  /** Optional path to main application log file */
  logFile?: string

  /** Optional path to audit log file */
  auditFile?: string

  /** Type of transport mechanism */
  transportType: TransportType

  /** Whether to colorize console output */
  colorize?: boolean
}

/**
 * Available transport mechanisms.
 */
export type TransportType = 'file' | 'memory'

/**
 * Predefined configuration templates for different environments.
 */
export const LogConfigPresets = {
  /**
   * Development configuration optimized for debugging and local development.
   */
  development: {
    level: 'debug',
    environment: 'development',
    transportType: 'file',
    logFile: '~/.local/share/project-manager-dev/logs/app.log',
    colorize: true,
  } satisfies LogConfig,

  /**
   * Test configuration optimized for test reliability and debugging.
   */
  test: {
    level: 'warn',
    environment: 'testing',
    transportType: 'memory',
  } satisfies LogConfig,

  /**
   * Production configuration optimized for performance and operational monitoring.
   */
  production: {
    level: 'info',
    environment: 'production',
    transportType: 'file',
    logFile: '~/.local/share/project-manager/logs/app.log',
    auditFile: '~/.local/share/project-manager/logs/audit.log',
  } satisfies LogConfig,
} as const

/**
 * Audit-specific configuration interface.
 */
export interface AuditConfig {
  /** Whether audit logging is enabled */
  enabled: boolean

  /** Path to audit log file */
  auditFile: string

  /** Whether to use separate audit transport */
  separateTransport?: boolean
}

/**
 * Utility functions for log configuration.
 */
export const LogConfigUtils = {
  /**
   * Check if a log level should be output based on current configuration.
   */
  shouldLog(currentLevel: LogLevel, configuredLevel: LogLevel): boolean {
    return LogLevelValues[currentLevel] >= LogLevelValues[configuredLevel]
  },

  /**
   * Merge multiple log configurations, with later configs overriding earlier ones.
   */
  mergeConfigs(...configs: Partial<LogConfig>[]): LogConfig {
    const base: LogConfig = {
      level: 'info',
      environment: 'production',
      transportType: 'file',
    }

    return configs.reduce<LogConfig>((merged, config) => {
      return {
        level: config.level || merged.level,
        environment: config.environment || merged.environment,
        transportType: config.transportType || merged.transportType,
        logFile: config.logFile || merged.logFile,
        auditFile: config.auditFile || merged.auditFile,
        colorize: config.colorize !== undefined ? config.colorize : merged.colorize,
      }
    }, base)
  },

  /**
   * Validate log configuration for common issues.
   */
  validateConfig(config: LogConfig): string[] {
    const errors: string[] = []

    // Validate log level
    if (!['debug', 'info', 'warn', 'error', 'fatal'].includes(config.level)) {
      errors.push(`Invalid log level: ${config.level}`)
    }

    // Validate environment
    if (
      !['development', 'testing', 'production', 'in-memory', 'isolated'].includes(
        config.environment
      )
    ) {
      errors.push(`Invalid environment: ${config.environment}`)
    }

    // Validate transport
    if (!['file', 'memory'].includes(config.transportType)) {
      errors.push(`Invalid transport type: ${config.transportType}`)
    }

    // Validate file paths for file transport
    if (config.transportType === 'file' && !config.logFile) {
      errors.push('Log file path required for file transport')
    }

    // Validate that file paths are not empty strings
    if (config.logFile !== undefined && config.logFile.trim() === '') {
      errors.push('Log file path cannot be empty')
    }
    if (config.auditFile !== undefined && config.auditFile.trim() === '') {
      errors.push('Audit file path cannot be empty')
    }

    return errors
  },
} as const
