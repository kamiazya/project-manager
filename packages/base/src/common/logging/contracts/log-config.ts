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

  /** Transport configuration for log output */
  transport: LogTransportConfig

  /** Optional log rotation configuration */
  rotation?: LogRotationConfig

  /** Performance optimization settings */
  // performance: LogPerformanceConfig

  /** Optional filtering configuration */
  filters?: LogFilterConfig

  /** Optional sampling configuration for high-volume logs */
  sampling?: LogSamplingConfig
}

/**
 * Transport configuration specifying where and how logs are output.
 */
export interface LogTransportConfig {
  /** Type of transport mechanism */
  type: TransportType

  /** Whether to colorize console output */
  colorize?: boolean

  /** Maximum entries for memory transport (test/debugging) */
  maxEntries?: number
}

/**
 * Available transport mechanisms.
 */
export type TransportType = 'console' | 'file' | 'memory'

/**
 * Log rotation configuration for file-based logging.
 */
export interface LogRotationConfig {
  /** Maximum size before rotation (e.g., '100MB', '1GB') */
  maxSize: string

  /** Maximum number of rotated files to keep */
  maxFiles: number

  /** Optional time-based rotation interval */
  interval?: RotationInterval
}

/**
 * Time-based rotation intervals.
 */
export type RotationInterval = 'daily' | 'weekly'

/**
 * Performance optimization configuration.
 */
// export interface LogPerformanceConfig {
//   /** Size of log buffer for batch writes */
//   bufferSize?: number

//   /** Interval in milliseconds to flush buffer */
//   flushInterval?: number

//   /** Whether to enable log level checking optimization */
//   enableLevelCheck?: boolean
// }

/**
 * Log filtering configuration for excluding certain logs.
 */
export interface LogFilterConfig {
  /** Components to exclude from logging */
  excludeComponents?: string[]

  /** Operations to exclude from logging */
  excludeOperations?: string[]

  /** User IDs to exclude from logging (privacy) */
  excludeUsers?: string[]

  /** Log levels to exclude */
  excludeLevels?: LogLevel[]

  /** Regular expressions for message filtering */
  excludePatterns?: string[]
}

/**
 * Sampling configuration for reducing log volume in high-traffic scenarios.
 */
export interface LogSamplingConfig {
  /** Enable sampling */
  enabled: boolean

  /** Sample rate (0.0 to 1.0, where 1.0 means no sampling) */
  rate: number

  /** Always sample error and fatal level logs regardless of rate */
  alwaysSampleErrors?: boolean

  /** Operations to always sample regardless of rate */
  alwaysSampleOperations?: string[]
}

/**
 * Predefined configuration templates for different environments.
 */
export const LogConfigPresets = {
  /**
   * Development configuration optimized for debugging and local development.
   */
  development: {
    level: 'debug' as LogLevel,
    environment: 'development' as EnvironmentMode,
    transport: {
      type: 'console' as TransportType,
      colorize: true,
    },
  } satisfies LogConfig,

  /**
   * Test configuration optimized for test reliability and debugging.
   */
  test: {
    level: 'warn' as LogLevel,
    environment: 'testing' as EnvironmentMode,
    transport: {
      type: 'memory' as TransportType,
      maxEntries: 1000,
    },
  } satisfies LogConfig,

  /**
   * Production configuration optimized for performance and operational monitoring.
   */
  production: {
    level: 'info' as LogLevel,
    environment: 'production' as EnvironmentMode,
    logFile: '~/.local/share/project-manager/logs/app.log',
    auditFile: '~/.local/share/project-manager/logs/audit.log',
    transport: {
      type: 'file' as TransportType,
    },
    rotation: {
      maxSize: '100MB',
      maxFiles: 10,
      interval: 'daily' as RotationInterval,
    },
    sampling: {
      enabled: false, // Can be enabled for very high traffic
      rate: 1.0,
      alwaysSampleErrors: true,
    },
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

  /** Audit retention policy */
  retention?: AuditRetentionConfig

  /** Audit integrity settings */
  integrity?: AuditIntegrityConfig
}

/**
 * Audit log retention configuration.
 */
export interface AuditRetentionConfig {
  /** How long to keep audit logs (in days) */
  retentionDays: number

  /** Whether to compress archived audit logs */
  compress: boolean

  /** Whether to automatically clean up old audit logs */
  autoCleanup: boolean
}

/**
 * Audit integrity configuration for tamper detection.
 */
export interface AuditIntegrityConfig {
  /** Whether to enable cryptographic signatures */
  enableSigning: boolean

  /** Whether to enable hash chain validation */
  enableHashChain: boolean

  /** Verification interval in hours */
  verificationInterval?: number
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
      transport: {
        type: 'console',
      },
    }

    return configs.reduce<LogConfig>((merged, config) => {
      const result: LogConfig = {
        level: config.level || merged.level || 'info',
        environment: config.environment || merged.environment || 'production',
        transport: {
          ...(merged.transport || {}),
          ...(config.transport || {}),
          type: config.transport?.type || merged.transport?.type || 'console',
        },
        rotation: config.rotation
          ? {
              ...merged.rotation,
              ...config.rotation,
            }
          : merged.rotation,
        filters: config.filters
          ? {
              ...merged.filters,
              ...config.filters,
            }
          : merged.filters,
        sampling: config.sampling
          ? {
              ...merged.sampling,
              ...config.sampling,
            }
          : merged.sampling,
      }
      return result
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
    if (!['console', 'file', 'memory'].includes(config.transport.type)) {
      errors.push(`Invalid transport type: ${config.transport.type}`)
    }

    // Validate file paths for file transport
    if (config.transport.type === 'file' && !config.logFile) {
      errors.push('Log file path required for file transport')
    }

    // Validate that file paths are not empty strings
    if (config.logFile !== undefined && config.logFile.trim() === '') {
      errors.push('Log file path cannot be empty')
    }
    if (config.auditFile !== undefined && config.auditFile.trim() === '') {
      errors.push('Audit file path cannot be empty')
    }

    // Validate rotation settings
    if (config.rotation) {
      if (config.rotation.maxFiles < 1) {
        errors.push('Maximum files must be at least 1')
      }
      if (!config.rotation.maxSize.match(/^\d+[KMGT]B$/)) {
        errors.push('Invalid max size format (use format like "100MB")')
      }
    }

    // Validate performance settings
    // if (config.performance.asyncLogging) {
    //   if (config.performance.bufferSize !== undefined && config.performance.bufferSize < 1) {
    //     errors.push('Buffer size must be at least 1')
    //   }
    //   if (config.performance.flushInterval !== undefined && config.performance.flushInterval < 1) {
    //     errors.push('Flush interval must be at least 1ms')
    //   }
    // }

    // Validate sampling settings
    if (config.sampling) {
      if (config.sampling.rate < 0 || config.sampling.rate > 1) {
        errors.push('Sampling rate must be between 0.0 and 1.0')
      }
    }

    return errors
  },
} as const
