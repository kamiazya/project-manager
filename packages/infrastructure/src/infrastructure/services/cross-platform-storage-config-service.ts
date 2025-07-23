/**
 * Cross-platform storage configuration service using env-paths
 *
 * Replaces Linux-specific XDG implementation with true cross-platform solution.
 * Automatically follows platform-specific conventions:
 * - Windows: %APPDATA%, %LOCALAPPDATA%
 * - macOS: ~/Library/Application Support, ~/Library/Logs
 * - Linux: ~/.config, ~/.local/state (XDG spec)
 */

import { join } from 'node:path'
import type { StorageConfigService } from '@project-manager/application'
import envPaths from 'env-paths'

// Storage configuration constants
const STORAGE_CONFIG = {
  APP_NAME: 'project-manager',
  SUFFIX: '', // No suffix - handled by environment-specific naming
  DEFAULT_TICKETS_FILE: 'tickets.json',
  LOGS_SUBDIRECTORY: 'logs',
} as const

// Environment variables
const ENV_VARS = {
  STORAGE_PATH: 'PM_STORAGE_PATH',
} as const

/**
 * Cross-platform storage configuration service using env-paths.
 *
 * Automatically handles platform-specific directory conventions while maintaining
 * environment-specific directory separation for development, test, and production.
 *
 * @example
 * ```typescript
 * const service = new CrossPlatformStorageConfigService()
 *
 * // Get development storage directory (NODE_ENV=development)
 * const devStorageDir = service.getDefaultStorageDir()
 * // Linux: ~/.config/project-manager-dev
 * // macOS: ~/Library/Application Support/project-manager-dev
 * // Windows: %APPDATA%\project-manager-dev
 *
 * // Get production logs directory (NODE_ENV=production)
 * const prodLogsDir = service.getLogsPath()
 * // Linux: ~/.local/state/project-manager/logs
 * // macOS: ~/Library/Logs/project-manager/logs
 * // Windows: %LOCALAPPDATA%\project-manager\logs
 * ```
 */
export class CrossPlatformStorageConfigService implements StorageConfigService {
  private readonly paths: ReturnType<typeof envPaths>

  constructor() {
    // Create environment-specific app name based on NODE_ENV
    const appName = this.getEnvironmentSpecificAppName()
    this.paths = envPaths(appName, { suffix: STORAGE_CONFIG.SUFFIX })
  }

  /**
   * Repository identifier for caching - minification-safe and stable across instances
   */
  readonly serviceId = 'CrossPlatformStorageConfigService'

  /**
   * Get the default storage directory path following platform conventions
   */
  getDefaultStorageDir(): string {
    // Since the app name already includes environment, no additional suffix needed
    return this.paths.config
  }

  /**
   * Get the default storage file path
   */
  getDefaultStoragePath(): string {
    return join(this.getDefaultStorageDir(), STORAGE_CONFIG.DEFAULT_TICKETS_FILE)
  }

  /**
   * Get storage path from environment variable or default
   */
  resolveStoragePath(customPath?: string): string {
    // Priority: custom path > environment variable > default
    if (customPath?.trim()) {
      return customPath.trim()
    }

    const envPath = process.env[ENV_VARS.STORAGE_PATH]?.trim()
    if (envPath && envPath.length > 0) {
      return envPath
    }

    return this.getDefaultStoragePath()
  }

  /**
   * Get the logs directory path following platform conventions
   *
   * @returns Platform-specific logs directory path
   *
   * @example
   * ```typescript
   * service.getLogsPath()
   * // Linux: ~/.local/state/project-manager-dev/logs
   * // macOS: ~/Library/Logs/project-manager-dev/logs
   * // Windows: %LOCALAPPDATA%\project-manager-dev\logs
   * ```
   */
  getLogsPath(): string {
    // Since the app name already includes environment, no additional suffix needed
    return join(this.paths.log, STORAGE_CONFIG.LOGS_SUBDIRECTORY)
  }

  /**
   * Get full path for application log file.
   *
   * @param filename Optional filename (defaults to 'app.log')
   * @returns Full path to application log file
   *
   * @example
   * ```typescript
   * const service = new CrossPlatformStorageConfigService()
   * const appLogPath = service.getApplicationLogPath()
   * // Linux: ~/.local/state/project-manager-dev/logs/app.log
   * ```
   */
  getApplicationLogPath(filename: string = 'app.log'): string {
    return join(this.getLogsPath(), filename)
  }

  /**
   * Get full path for audit log file.
   *
   * @param filename Optional filename (defaults to 'audit.log')
   * @returns Full path to audit log file
   *
   * @example
   * ```typescript
   * const service = new CrossPlatformStorageConfigService()
   * const auditLogPath = service.getAuditLogPath()
   * // Linux: ~/.local/state/project-manager-dev/logs/audit.log
   * ```
   */
  getAuditLogPath(filename: string = 'audit.log'): string {
    return join(this.getLogsPath(), filename)
  }

  /**
   * Get environment-specific app name for env-paths
   *
   * @returns App name with environment suffix (e.g., 'project-manager-dev')
   * @private
   */
  private getEnvironmentSpecificAppName(): string {
    const environment = process.env.NODE_ENV || 'development'

    switch (environment) {
      case 'development':
        return `${STORAGE_CONFIG.APP_NAME}-dev`
      case 'test':
        return `${STORAGE_CONFIG.APP_NAME}-test`
      case 'production':
        return STORAGE_CONFIG.APP_NAME // No suffix for production
      default:
        return `${STORAGE_CONFIG.APP_NAME}-${environment}` // Custom environment modes
    }
  }
}
